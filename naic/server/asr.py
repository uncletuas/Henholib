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

    device = 0 if settings.asr_device.startswith("cuda") else -1
    return pipeline(
        "automatic-speech-recognition",
        model=model_id,
        token=settings.hf_token or None,
        device=device,
    )


def _decode_to_array(audio_bytes: bytes):
    """Decode arbitrary audio bytes (webm/ogg/wav/mp3) to a 16 kHz mono array."""
    import soundfile as sf  # type: ignore
    import librosa  # type: ignore

    data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
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


def health() -> dict:
    return {
        "models": ASR_MODELS,
        "device": settings.asr_device,
        "mode": "stub" if settings.asr_stub else "live",
    }
