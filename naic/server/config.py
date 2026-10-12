"""Runtime configuration for the NAIC voice-first service.

Every external dependency is addressed by an environment variable so the same
code runs against (a) a local stub while we wait on GPU capacity, (b) a vLLM
server on an EC2 g5 box, or (c) a Hugging Face Inference Endpoint. Nothing here
is swapped by editing code -- only the environment changes.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _bool(name: str, default: bool = False) -> bool:
    raw = _env(name)
    if not raw:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    # N-ATLaS (the mandatory LLM integration). We talk to it over an
    # OpenAI-compatible chat endpoint, which is what vLLM and HF TGI both expose.
    natlas_base_url: str = field(default_factory=lambda: _env("NATLAS_BASE_URL"))
    natlas_api_key: str = field(default_factory=lambda: _env("NATLAS_API_KEY", "not-needed"))
    natlas_model: str = field(default_factory=lambda: _env("NATLAS_MODEL", "NCAIR1/N-ATLaS"))
    # When no endpoint is configured yet, the LLM runs in a visible stub mode so
    # the rest of the pipeline is demoable. Never leave this on for submission.
    llm_stub: bool = field(default_factory=lambda: _bool("NATLAS_STUB", default=False))

    # Hugging Face token, needed to pull the gated NCAIR weights (LLM + ASR).
    hf_token: str = field(default_factory=lambda: _env("HF_TOKEN"))

    # ASR: NCAIR's own Nigerian speech models, one per language.
    asr_device: str = field(default_factory=lambda: _env("ASR_DEVICE", "cpu"))
    asr_stub: bool = field(default_factory=lambda: _bool("ASR_STUB", default=False))

    # WhatsApp (Twilio sandbox for the sprint; Business API later).
    twilio_account_sid: str = field(default_factory=lambda: _env("TWILIO_ACCOUNT_SID"))
    twilio_auth_token: str = field(default_factory=lambda: _env("TWILIO_AUTH_TOKEN"))

    # Where interaction logs (the 50-user validation evidence) are written.
    data_dir: str = field(default_factory=lambda: _env("NAIC_DATA_DIR", "./data"))

    def natlas_ready(self) -> bool:
        return bool(self.natlas_base_url) and not self.llm_stub


# NCAIR's four published ASR models, keyed by the language the user is speaking.
# en-NG also covers code-switched English, with the caveat the model card notes.
ASR_MODELS = {
    "yo": "NCAIR1/Yoruba-ASR",
    "ha": "NCAIR1/Hausa-ASR",
    "ig": "NCAIR1/Igbo-ASR",
    "en": "NCAIR1/NigerianAccentedEnglish",
}

LANGUAGE_NAMES = {
    "yo": "Yoruba",
    "ha": "Hausa",
    "ig": "Igbo",
    "en": "Nigerian English",
    "pcm": "Nigerian Pidgin",
}

settings = Settings()
