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
    "N-ATLaS. Answer plainly in the same Nigerian language the user used "
    "({language}), in two or three short sentences, because your answer will be "
    "spoken aloud. Give practical, safe, general health guidance. You are "
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
    system = {"role": "system", "content": SYSTEM_PROMPT.format(language=language)}
    return complete([system, *messages], timeout=timeout)[0]


def complete(
    messages: list[dict],
    max_tokens: int | None = None,
    temperature: float = 0.3,
    timeout: int = 60,
) -> tuple[str, int, int]:
    """Run a full message list (system prompt included) through N-ATLaS.

    Returns (reply, prompt_tokens, completion_tokens). Used directly by the
    OpenAI-compatible endpoint, where the caller brings its own system prompt.
    """
    if not settings.natlas_ready():
        return _stub_reply(messages, "stub"), 0, 0
    if settings.natlas_backend == "local":
        import llm_local

        try:
            return llm_local.generate(messages, max_tokens, temperature)
        except Exception as exc:  # torch raises a wide range
            raise NatlasError(f"N-ATLaS (local) failed: {exc}") from exc
    return _complete_http(messages, max_tokens, temperature, timeout), 0, 0


def _complete_http(messages: list[dict], max_tokens: int | None, temperature: float, timeout: int) -> str:
    payload = {
        "model": settings.natlas_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": min(max_tokens or settings.natlas_max_new_tokens, settings.natlas_max_new_tokens),
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
    out = {
        "model": settings.natlas_model,
        "backend": settings.natlas_backend,
        "endpoint": settings.natlas_base_url or None,
        "mode": "live" if settings.natlas_ready() else "stub",
    }
    if settings.natlas_backend == "local":
        import llm_local

        out["loaded"] = llm_local.loaded()
    return out
