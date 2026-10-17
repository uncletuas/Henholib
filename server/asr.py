"""Speech-to-text using NCAIR's own Nigerian ASR models.

Four Whisper-based models, one per language (see config.ASR_MODELS). They are
small (Whisper-small, 244M) and run on CPU acceptably, so the voice-in layer
does not compete with the LLM for the GPU. Models are loaded lazily and cached.

Audio contract from the model cards: 16 kHz mono waveform, up to 30 s per call.
"""
from __future__ import annotations

import functools
import io

from config import settings, ASR_MODELS


class ASRError(RuntimeError):
    pass


@functools.lru_cache(maxsize=8)
def _pipeline(model_id: str):
    # Imported lazily so the module (and the stub path) load without torch.
    from transformers import pipeline  # type: ignore

    on_gpu = settings.asr_device.startswith("cuda")
    kwargs = {}
    if on_gpu:
        import torch  # type: ignore

        kwargs["torch_dtype"] = torch.float16
    return pipeline(
        "automatic-speech-recognition",
        model=model_id,
        token=settings.hf_token or None,
        device=0 if on_gpu else -1,
        **kwargs,
    )


def _decode_to_array(audio_bytes: bytes):
    """Decode arbitrary audio bytes (webm/ogg/wav/mp3) to a 16 kHz mono array."""
    import soundfile as sf  # type: ignore
    import librosa  # type: ignore

    try:
        data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
    except Exception:
        # soundfile reads WAV/FLAC/OGG but not the WebM/Opus most browsers record
        # and WhatsApp sends; librosa hands those to ffmpeg via a temp file.
        import os
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as fh:
            fh.write(audio_bytes)
            path = fh.name
        try:
            data, sr = librosa.load(path, sr=16000, mono=True)
        finally:
            os.unlink(path)
    if getattr(data, "ndim", 1) > 1:
        data = data.mean(axis=1)  # downmix to mono
    if sr != 16000:
        data = librosa.resample(data, orig_sr=sr, target_sr=16000)
    return data


def transcribe(audio_bytes: bytes, language: str) -> str:
    """Transcribe speech in the given language ('yo'|'ha'|'ig'|'en'|'pcm')."""
    if settings.asr_stub:
        return f"[asr stub:{language}] (set ASR_STUB=0 to run NCAIR {ASR_MODELS.get(language, ASR_MODELS['en'])})"

    # Pidgin has no dedicated model yet; the Nigerian-English model handles it
    # best of the four given the shared lexicon.
    model_id = ASR_MODELS.get(language) or ASR_MODELS["en"]
    try:
        array = _decode_to_array(audio_bytes)
        result = _pipeline(model_id)(array)
    except Exception as exc:  # torch/transformers raise a wide range
        raise ASRError(f"ASR failed for {model_id}: {exc}") from exc
    text = (result or {}).get("text", "").strip()
    if not text:
        raise ASRError("ASR returned empty text")
    return text


def _scored(array, model_id: str) -> tuple[str, float]:
    """Transcribe and score: the mean log-probability of the words the model chose.

    A model listening to its own language is sure of its words; one listening to
    another language guesses, and its score drops. That is how the right NCAIR
    model is picked when nobody says which language is being spoken.
    """
    import torch  # type: ignore

    pipe = _pipeline(model_id)
    model = pipe.model
    feats = pipe.feature_extractor(array, sampling_rate=16000, return_tensors="pt").input_features
    feats = feats.to(model.device, dtype=model.dtype)
    with torch.inference_mode():
        out = model.generate(feats, return_dict_in_generate=True, output_scores=True, max_new_tokens=220)
    steps = out.scores
    chosen = out.sequences[0][-len(steps):] if steps else []
    lps = [torch.log_softmax(s[0].float(), -1)[int(t)].item() for s, t in zip(steps, chosen)]
    text = pipe.tokenizer.decode(out.sequences[0], skip_special_tokens=True).strip()
    return text, (sum(lps) / len(lps)) if lps else float("-inf")


# A hint model this sure of itself is accepted without trying the others.
_CONFIDENT = -0.35


def transcribe_auto(audio_bytes: bytes, hint: str = "en") -> dict:
    """Transcribe in whichever NCAIR language the speaker is using.

    The hinted language (the conversation's current one) is tried first; only
    if it is unsure are the other three models tried, so a conversation that
    stays in one language pays for one model, not four.
    """
    if settings.asr_stub:
        return {"text": transcribe(audio_bytes, hint), "language": hint, "score": 0.0, "tried": [hint]}
    hint = hint if hint in ASR_MODELS else "en"
    try:
        array = _decode_to_array(audio_bytes)
        best_text, best_score = _scored(array, ASR_MODELS[hint])
        best_lang, tried = hint, [hint]
        if best_score < _CONFIDENT:
            for code, model_id in ASR_MODELS.items():
                if code == hint:
                    continue
                text, score = _scored(array, model_id)
                tried.append(code)
                if score > best_score:
                    best_text, best_score, best_lang = text, score, code
    except Exception as exc:  # torch/transformers raise a wide range
        raise ASRError(f"ASR failed: {exc}") from exc
    if not best_text:
        raise ASRError("ASR returned empty text")
    return {"text": best_text, "language": best_lang, "score": round(best_score, 3), "tried": tried}


def transcribe_warm(language: str) -> None:
    """Load a language's model ahead of the first real request."""
    _pipeline(ASR_MODELS.get(language) or ASR_MODELS["en"])


def health() -> dict:
    return {
        "models": ASR_MODELS,
        "device": settings.asr_device,
        "mode": "stub" if settings.asr_stub else "live",
    }
