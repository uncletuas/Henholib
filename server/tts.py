"""Speech out: the finished N-ATLaS reply, spoken in a Nigerian voice.

NCAIR publishes no text-to-speech model, so this uses YarnGPT2b (Apache 2.0,
Nigerian-accented English, Yoruba, Igbo and Hausa). It only turns N-ATLaS's
finished sentence into sound; no understanding or answering happens here.

Usage follows the YarnGPT2b model card: a 360M language model writes audio codes
for the text, prompted with a reference speaker, and WavTokenizer turns the codes
into 24 kHz audio. The YarnGPT repo and the WavTokenizer checkpoint are fetched by
the notebook (see colab/); their paths come from config.
"""
from __future__ import annotations

import io
import logging
import math
import os
import re
import struct
import sys
import threading
import time

from config import settings

SAMPLE_RATE = 24000
# Half a second of silence between sentences, as the model card does it.
_PAUSE = [453] * 38
_WORDS_PER_CHUNK = 25

# The voices each language was trained with. A voice from the wrong language is
# the usual cause of speech that sounds nothing like the text.
LANGUAGES = {"en": "english", "pcm": "english", "yo": "yoruba", "ig": "igbo", "ha": "hausa"}
VOICES = {"english": "idera", "yoruba": "yoruba_female2", "igbo": "igbo_female2", "hausa": "hausa_female1"}

log = logging.getLogger("tts")
_lock = threading.Lock()
_audio_tokenizer = None
_model = None


class TTSError(RuntimeError):
    pass


def load() -> None:
    global _audio_tokenizer, _model
    if _model is not None:
        return
    if settings.yarngpt_dir not in sys.path:
        sys.path.insert(0, settings.yarngpt_dir)
    from transformers import AutoModelForCausalLM  # type: ignore
    from yarngpt.audiotokenizer import AudioTokenizerV2  # type: ignore

    _audio_tokenizer = AudioTokenizerV2(
        "saheedniyi/YarnGPT2b", settings.wavtokenizer_ckpt, settings.wavtokenizer_config
    )
    import torch  # type: ignore

    # Half precision on a GPU: the measured first run spent 35 s voicing two
    # sentences in the checkpoint's 32-bit weights. The codec stays 32-bit.
    on_gpu = _audio_tokenizer.device.type == "cuda"
    _model = AutoModelForCausalLM.from_pretrained(
        "saheedniyi/YarnGPT2b", torch_dtype=torch.float16 if on_gpu else "auto"
    ).to(_audio_tokenizer.device)
    _model.eval()
    tok = _audio_tokenizer.tokenizer
    if tok.pad_token_id is None:
        tok.pad_token = tok.eos_token
    _enable_compile()


# Measured on a T4: two short sentences took ~14 s, mostly Python overhead per
# generated step of a small (360M) model. A static KV cache keeps each decode
# step the same shape, so torch.compile can replay it as a CUDA graph. If
# compiling fails on a given runtime, the eager path is restored and used.
_eager_forward = None
_compiled = False


def _compile_mode() -> str:
    """off | cudagraphs (fastest, replays each decode step) | fused (no CUDA graphs)."""
    m = os.environ.get("TTS_COMPILE", "0").strip().lower()
    return {"0": "off", "": "off", "1": "cudagraphs"}.get(m, m)


def _enable_compile() -> None:
    global _eager_forward, _compiled
    mode = _compile_mode()
    if mode == "off" or _audio_tokenizer.device.type != "cuda":
        return
    import torch  # type: ignore

    try:
        _eager_forward = _model.forward
        if mode == "cudagraphs":
            _model.generation_config.cache_implementation = "static"
            graphed = torch.compile(_eager_forward, mode="reduce-overhead")

            def forward(*args, **kwargs):
                # Each decode step is a new graph run; without this mark the static
                # cache reads an output the next replay has already overwritten.
                torch.compiler.cudagraph_mark_step_begin()
                return graphed(*args, **kwargs)

            _model.forward = forward
        else:
            _model.forward = torch.compile(_eager_forward, mode="max-autotune-no-cudagraphs", dynamic=True)
        _compiled = True
        print(f"[tts] voice model compiled ({mode})", flush=True)
    except Exception as exc:
        log.warning("could not compile the voice model (%s); using it uncompiled", exc)
        _disable_compile()


def _disable_compile() -> None:
    global _compiled
    if _eager_forward is not None:
        _model.forward = _eager_forward
    _model.generation_config.cache_implementation = None
    _compiled = False


def _chunks(text: str) -> list[str]:
    """Sentences, each split further if longer than the model handles well."""
    out: list[str] = []
    for sentence in re.split(r"(?<=[.!?])\s+", text.strip()):
        words = sentence.strip().rstrip(".!?").split()
        if not words:
            continue
        parts = max(1, math.ceil(len(words) / _WORDS_PER_CHUNK))
        size = math.ceil(len(words) / parts)
        out.append(".")
        out.extend(" ".join(words[i : i + size]) for i in range(0, len(words), size))
    return out


def _spoken_part(text: str) -> str:
    words = text.split()
    if len(words) <= settings.tts_max_words:
        return text
    cut = " ".join(words[: settings.tts_max_words])
    # End on a sentence if one finishes inside the limit.
    end = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"))
    return cut[: end + 1] if end > len(cut) // 2 else cut


def _wav(samples, sample_rate: int) -> bytes:
    import numpy as np  # type: ignore
    import soundfile as sf  # type: ignore

    buf = io.BytesIO()
    sf.write(buf, np.asarray(samples, dtype="float32"), sample_rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def _tone() -> bytes:
    """A short beep, so the stub path still returns playable audio."""
    n = int(SAMPLE_RATE * 0.4)
    frames = b"".join(
        struct.pack("<h", int(8000 * math.sin(2 * math.pi * 440 * i / SAMPLE_RATE))) for i in range(n)
    )
    header = b"RIFF" + struct.pack("<I", 36 + len(frames)) + b"WAVEfmt " + struct.pack(
        "<IHHIIHH", 16, 1, 1, SAMPLE_RATE, SAMPLE_RATE * 2, 2, 16
    ) + b"data" + struct.pack("<I", len(frames))
    return header + frames


def set_compile(on: bool, mode: str = "cudagraphs") -> bool:
    """Switch the compiled decode path at runtime (the admin endpoint); returns the new state."""
    import torch  # type: ignore

    load()
    with _lock:
        _disable_compile()
        if hasattr(torch, "_dynamo"):
            torch._dynamo.reset()
        if on:
            os.environ["TTS_COMPILE"] = mode if mode in ("cudagraphs", "fused") else "cudagraphs"
            _enable_compile()
        else:
            os.environ["TTS_COMPILE"] = "0"
    return _compiled


def synthesize(text: str, language: str = "en", voice: str | None = None) -> tuple[bytes, str]:
    """Return (wav_bytes, voice) for the text in the given language code."""
    if not settings.tts_enabled:
        raise TTSError("speech out is disabled (TTS_ENABLED=0)")
    lang = LANGUAGES.get(language, "english")
    speaker = voice or VOICES[lang]
    if settings.tts_stub:
        return _tone(), speaker
    spoken = _spoken_part(text)
    if not spoken.strip():
        raise TTSError("no text to speak")

    import torch  # type: ignore

    load()
    started = time.monotonic()
    chunks = _chunks(spoken)
    texts = [c for c in chunks if c != "."]
    try:
        with _lock, torch.inference_mode():
            try:
                per_chunk = _generate_batch(texts, lang, speaker)
            except Exception as exc:
                if _compiled:
                    log.warning("compiled voice failed (%s); switching to uncompiled", exc)
                    _disable_compile()
                    if hasattr(torch, "_dynamo"):
                        torch._dynamo.reset()
                else:
                    log.warning("batched synthesis failed (%s); voicing one sentence at a time", exc)
                try:
                    per_chunk = _generate_batch(texts, lang, speaker)
                except Exception:
                    per_chunk = [_generate_one(t, lang, speaker) for t in texts]
            codes: list[int] = []
            remaining = iter(per_chunk)
            for chunk in chunks:
                codes.extend(_PAUSE if chunk == "." else next(remaining))
            audio = _audio_tokenizer.get_audio(codes)
    except Exception as exc:  # the caller falls back to captions
        raise TTSError(f"synthesis failed: {exc}") from exc
    samples = audio.squeeze().float().numpy()
    took = time.monotonic() - started
    print(f"[tts] {len(spoken)} chars, {len(texts)} chunk(s), {len(samples) / SAMPLE_RATE:.1f}s audio in {took:.1f}s "
          f"(compiled={_compile_mode() if _compiled else 'off'})", flush=True)
    return _wav(samples, SAMPLE_RATE), speaker


_GEN = dict(temperature=0.1, repetition_penalty=1.1, max_length=4000)


def _generate_one(text: str, lang: str, speaker: str) -> list[int]:
    """The model card's own path: one sentence per generate call."""
    prompt = _audio_tokenizer.create_prompt(text, lang=lang, speaker_name=speaker)
    out = _model.generate(input_ids=_audio_tokenizer.tokenize_prompt(prompt), **_GEN)
    return _audio_tokenizer.get_codes(out)


def _pad_id(tok) -> int:
    """A padding token that is not an end-of-speech token.

    Repetition penalty also counts padding, so padding with the stop token
    would make the shorter rows less willing to stop, and they ramble on.
    """
    stops = _model.generation_config.eos_token_id
    stops = set(stops if isinstance(stops, list) else [stops]) | {tok.eos_token_id}
    for candidate in ("<|endoftext|>", "<|text_sep|>", tok.pad_token):
        tid = tok.convert_tokens_to_ids(candidate) if candidate else None
        if isinstance(tid, int) and tid != tok.unk_token_id and tid not in stops:
            return tid
    return tok.pad_token_id


def _generate_batch(texts: list[str], lang: str, speaker: str) -> list[list[int]]:
    """All sentences in one generate call: they decode side by side, so a reply
    takes about as long as its longest sentence instead of the sum of them."""
    if len(texts) == 1:
        return [_generate_one(texts[0], lang, speaker)]
    tok = _audio_tokenizer.tokenizer
    prompts = [_audio_tokenizer.create_prompt(t, lang=lang, speaker_name=speaker) for t in texts]
    pad = _pad_id(tok)
    rows = [tok.encode(p, add_special_tokens=False) for p in prompts]
    width = max(len(r) for r in rows)

    import torch  # type: ignore

    ids = torch.tensor([[pad] * (width - len(r)) + r for r in rows], device=_audio_tokenizer.device)
    mask = torch.tensor([[0] * (width - len(r)) + [1] * len(r) for r in rows], device=_audio_tokenizer.device)
    out = _model.generate(input_ids=ids, attention_mask=mask, pad_token_id=pad, **_GEN)
    return [_audio_tokenizer.extract_integers(tok.decode(row[width:])) for row in out]


def loaded() -> bool:
    return _model is not None


def health() -> dict:
    return {
        "engine": "YarnGPT2b",
        "mode": "off" if not settings.tts_enabled else ("stub" if settings.tts_stub else "live"),
        "loaded": loaded(),
        "voices": VOICES,
    }
