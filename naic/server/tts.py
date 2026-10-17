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
import math
import re
import struct
import sys
import threading

from config import settings

SAMPLE_RATE = 24000
# Half a second of silence between sentences, as the model card does it.
_PAUSE = [453] * 38
_WORDS_PER_CHUNK = 25

# The voices each language was trained with. A voice from the wrong language is
# the usual cause of speech that sounds nothing like the text.
LANGUAGES = {"en": "english", "pcm": "english", "yo": "yoruba", "ig": "igbo", "ha": "hausa"}
VOICES = {"english": "idera", "yoruba": "yoruba_female2", "igbo": "igbo_female2", "hausa": "hausa_female1"}

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
    _model = AutoModelForCausalLM.from_pretrained("saheedniyi/YarnGPT2b", torch_dtype="auto").to(
        _audio_tokenizer.device
    )
    _model.eval()


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
    try:
        codes: list[int] = []
        with _lock, torch.inference_mode():
            for chunk in _chunks(spoken):
                if chunk == ".":
                    codes.extend(_PAUSE)
                    continue
                prompt = _audio_tokenizer.create_prompt(chunk, lang=lang, speaker_name=speaker)
                ids = _audio_tokenizer.tokenize_prompt(prompt)
                out = _model.generate(
                    input_ids=ids, temperature=0.1, repetition_penalty=1.1, max_length=4000
                )
                codes.extend(_audio_tokenizer.get_codes(out))
            audio = _audio_tokenizer.get_audio(codes)
    except Exception as exc:  # the caller falls back to captions
        raise TTSError(f"synthesis failed: {exc}") from exc
    return _wav(audio.squeeze().float().numpy(), SAMPLE_RATE), speaker


def loaded() -> bool:
    return _model is not None


def health() -> dict:
    return {
        "engine": "YarnGPT2b",
        "mode": "off" if not settings.tts_enabled else ("stub" if settings.tts_stub else "live"),
        "loaded": loaded(),
        "voices": VOICES,
    }
