"""N-ATLaS client -- the mandatory sovereign-LLM integration.

N-ATLaS ships as Llama-3 8B weights (NCAIR1/N-ATLaS) with no hosted provider, so
we serve it ourselves with vLLM, which exposes an OpenAI-compatible
`/v1/chat/completions` endpoint. This client is a thin wrapper over that, with a
stub mode so the pipeline is demoable before the GPU box is live.

Attribution, per the N-ATLaS Open-Source Research and Innovation License:
powered by N-ATLaS, Awarri Technologies and the Federal Ministry of
Communications, Innovation and Digital Economy.
"""
from __future__ import annotations

import json
import urllib.request
import urllib.error
from typing import Iterable

from config import settings

# N-ATLaS is tuned for Nigerian languages; we keep the system prompt short and
# tell it which language the user used so replies come back in kind.
SYSTEM_PROMPT = (
    "You are a helpful health-information assistant for Nigerians, powered by "
    "N-ATLaS. Answer plainly and briefly in the same Nigerian language the user "
    "used ({language}). Give practical, safe, general health guidance. You are "
    "not a doctor: for anything urgent or serious, tell the user to visit a "
    "clinic or call emergency services. Do not invent facts."
)


class NatlasError(RuntimeError):
    pass


def _stub_reply(messages: list[dict], language: str) -> str:
    user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    return (
        f"[N-ATLaS stub | {language}] I heard: \"{user}\". "
        "The language model is not connected yet; set NATLAS_BASE_URL to the "
        "vLLM endpoint and this becomes a real N-ATLaS answer."
    )


def chat(messages: list[dict], language: str = "English", timeout: int = 60) -> str:
    """Send a chat turn to N-ATLaS and return the assistant's reply text."""
    if settings.llm_stub or not settings.natlas_base_url:
        return _stub_reply(messages, language)

    system = {"role": "system", "content": SYSTEM_PROMPT.format(language=language)}
    payload = {
        "model": settings.natlas_model,
        "messages": [system, *messages],
        "temperature": 0.3,
        "max_tokens": 512,
    }
    url = settings.natlas_base_url.rstrip("/") + "/chat/completions"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.natlas_api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:500]
        raise NatlasError(f"N-ATLaS HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise NatlasError(f"N-ATLaS unreachable at {url}: {exc.reason}") from exc

    try:
        return body["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as exc:
        raise NatlasError(f"Unexpected N-ATLaS response: {body}") from exc


def health() -> dict:
    """Report whether the real model is wired up, for /healthz and the demo UI."""
    return {
        "model": settings.natlas_model,
        "endpoint": settings.natlas_base_url or None,
        "mode": "stub" if (settings.llm_stub or not settings.natlas_base_url) else "live",
    }
