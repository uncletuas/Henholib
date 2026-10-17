"""NAIC 2026 Voice-First service -- FastAPI orchestration.

Flow: voice (web mic or WhatsApp) -> NCAIR ASR -> N-ATLaS -> Nigerian voice reply.

Demo endpoints (open, used by the web page in ../web):
  GET  /healthz           liveness + which components are live, stub or loading
  POST /api/transcribe    audio -> text (NCAIR ASR only)
  POST /api/chat          text -> N-ATLaS reply (no audio)
  POST /api/voice         audio -> {transcript, reply, audio}  (the full pipeline)
  POST /api/whatsapp      Twilio webhook (voice note or text) -> TwiML reply
  GET  /api/stats         interaction counts for the validation dashboard

Machine endpoints (Bearer NAIC_API_KEY), in the shapes the Loopital app's own
clients already speak, so pointing henholib.loopital.com here needs no code:
  POST /v1/chat/completions   OpenAI-compatible N-ATLaS chat
  POST /asr/{lang}            WAV body -> {"text"}         (HF endpoint format)
  POST /tts                   {"inputs","parameters"} -> {"audio": base64 WAV}

Built on Loopital for the National AI Innovation Challenge (NAIC) 2026.
Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of
Communications, Innovation and Digital Economy.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import threading
import time
import uuid

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles

import asr
import natlas_client as natlas
import store
import tts
from config import LANGUAGE_NAMES, settings

app = FastAPI(title="Loopital NAIC Voice-First", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_warm = {"state": "idle", "error": None}


def _lang_name(code: str) -> str:
    return LANGUAGE_NAMES.get(code, "Nigerian English")


def _require_key(authorization: str = Header(default="")) -> None:
    if not settings.api_key:
        return
    sent = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(sent, settings.api_key):
        raise HTTPException(status_code=401, detail="invalid API key")


@app.exception_handler(asr.ASRError)
async def _asr_error(_: Request, exc: asr.ASRError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"error": str(exc)})


@app.exception_handler(natlas.NatlasError)
async def _natlas_error(_: Request, exc: natlas.NatlasError) -> JSONResponse:
    return JSONResponse(status_code=502, content={"error": str(exc)})


@app.exception_handler(tts.TTSError)
async def _tts_error(_: Request, exc: tts.TTSError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"error": str(exc)})


def _warm_up() -> None:
    """Load every model before the first caller arrives, so no turn pays for it."""
    _warm["state"] = "loading"
    try:
        if settings.natlas_backend == "local" and not settings.llm_stub:
            import llm_local

            llm_local.load()
        if not settings.asr_stub:
            # All four: the first Yoruba clip on a cold model took 58 s, almost
            # all of it downloading and loading the model rather than listening.
            for code in ("en", "yo", "ig", "ha"):
                asr.transcribe_warm(code)
        if settings.tts_enabled and not settings.tts_stub:
            tts.load()
            # One short phrase compiles the GPU kernels, so the first real
            # reply does not pay for it.
            tts.synthesize("Hello.", "en")
        _warm["state"] = "ready"
    except Exception as exc:  # surfaced on /healthz rather than killing the server
        _warm["state"] = "failed"
        _warm["error"] = str(exc)


@app.on_event("startup")
def _startup() -> None:
    if os.environ.get("NAIC_PRELOAD", "").strip() in {"1", "true", "yes"}:
        threading.Thread(target=_warm_up, daemon=True).start()


def _speak(text: str, language: str) -> dict:
    """Voice the reply; a failure leaves captions rather than failing the turn."""
    try:
        wav, voice = tts.synthesize(text, language)
        return {"audio": base64.b64encode(wav).decode("ascii"), "voice": voice, "spoken": True}
    except tts.TTSError as exc:
        return {"audio": None, "spoken": False, "speech_error": str(exc)}


def _run_pipeline(audio_bytes: bytes, language: str, channel: str, user_ref: str, speak: bool) -> dict:
    started = time.monotonic()
    transcript = asr.transcribe(audio_bytes, language)
    reply = natlas.chat([{"role": "user", "content": transcript}], language=_lang_name(language))
    out = {"transcript": transcript, "reply": reply, "language": language}
    if speak:
        out.update(_speak(reply, language))
    out["latency_ms"] = int((time.monotonic() - started) * 1000)
    store.log_interaction(
        channel=channel,
        language=language,
        transcript=transcript,
        reply=reply,
        user_ref=user_ref,
        latency_ms=out["latency_ms"],
    )
    return out


@app.get("/healthz")
def healthz() -> dict:
    return {
        "ok": True,
        "warmup": _warm,
        "natlas": natlas.health(),
        "asr": asr.health(),
        "tts": tts.health(),
        "interactions": store.count(),
        "attribution": "Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of "
        "Communications, Innovation and Digital Economy.",
    }


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("en")) -> dict:
    text = asr.transcribe(await audio.read(), language)
    return {"transcript": text, "language": language}


@app.post("/api/chat")
async def chat(message: str = Form(...), language: str = Form("en")) -> dict:
    reply = natlas.chat([{"role": "user", "content": message}], language=_lang_name(language))
    store.log_interaction(channel="web", language=language, transcript=message, reply=reply, user_ref="text")
    return {"reply": reply}


@app.post("/api/voice")
async def voice(audio: UploadFile = File(...), language: str = Form("en"), speak: bool = Form(True)) -> dict:
    return _run_pipeline(await audio.read(), language, channel="web", user_ref="web", speak=speak)


@app.post("/api/whatsapp")
async def whatsapp(request: Request) -> Response:
    """Twilio WhatsApp webhook. Handles a voice note (media) or a text body."""
    form = await request.form()
    from_number = str(form.get("From", ""))
    user_ref = hashlib.sha256(from_number.encode()).hexdigest()[:12]
    language = "en"  # a production build would detect or let the user set this
    body = str(form.get("Body", "")).strip()
    num_media = int(str(form.get("NumMedia", "0")) or 0)

    if num_media > 0:
        import urllib.request as _r

        media_url = str(form.get("MediaUrl0"))
        # Twilio media needs basic auth with the account credentials.
        auth = None
        if settings.twilio_account_sid:
            token = base64.b64encode(
                f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode()
            ).decode()
            auth = {"Authorization": f"Basic {token}"}
        req = _r.Request(media_url, headers=auth or {})
        with _r.urlopen(req, timeout=60) as resp:
            audio_bytes = resp.read()
        result = _run_pipeline(audio_bytes, language, channel="whatsapp", user_ref=user_ref, speak=False)
        reply = result["reply"]
    elif body:
        reply = natlas.chat([{"role": "user", "content": body}], language=_lang_name(language))
        store.log_interaction(
            channel="whatsapp", language=language, transcript=body, reply=reply, user_ref=user_ref
        )
    else:
        reply = "Send a voice note or a message and N-ATLaS will reply."

    twiml = f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{_xml_escape(reply)}</Message></Response>"
    return Response(content=twiml, media_type="application/xml")


@app.get("/api/stats")
def stats() -> dict:
    return store.stats()


# ---------------------------------------------------------------------------
# Machine endpoints for the Loopital app (henholib.loopital.com)
# ---------------------------------------------------------------------------


def _text_of(content) -> str:
    """OpenAI content may be a string, null, or a list of typed parts."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(p.get("text", "") for p in content if isinstance(p, dict))
    return str(content)


def _llama_messages(raw: list[dict]) -> list[dict]:
    """Fit an OpenAI-style history to what a Llama-3 chat template accepts.

    The app may carry tool calls and tool results from earlier turns. N-ATLaS has
    no tool calling, so a tool result is passed on as plain context and an
    assistant turn that only called a tool is dropped.
    """
    out: list[dict] = []
    for m in raw:
        role = m.get("role", "user")
        text = _text_of(m.get("content")).strip()
        if role == "tool":
            role, text = "user", f"(Result from the app: {text})"
        elif role not in {"system", "user", "assistant"}:
            role = "user"
        if not text:
            continue
        if out and out[-1]["role"] == role and role != "system":
            out[-1]["content"] += "\n\n" + text
        else:
            out.append({"role": role, "content": text})
    return out


@app.get("/v1/models", dependencies=[Depends(_require_key)])
def models() -> dict:
    return {"object": "list", "data": [{"id": settings.natlas_model, "object": "model", "owned_by": "NCAIR1"}]}


@app.post("/v1/chat/completions", dependencies=[Depends(_require_key)])
async def chat_completions(request: Request) -> dict:
    body = await request.json()
    if body.get("stream"):
        raise HTTPException(status_code=400, detail="streaming is not supported; send stream=false")
    messages = _llama_messages(body.get("messages") or [])
    if not messages:
        raise HTTPException(status_code=400, detail="messages is empty")
    # `tools` is ignored rather than refused: N-ATLaS answers in plain text and
    # the caller treats a reply with no tool calls as a normal answer.
    started = time.monotonic()
    reply, p_tok, c_tok = natlas.complete(
        messages,
        max_tokens=body.get("max_tokens"),
        temperature=float(body.get("temperature", 0.3)),
    )
    print(f"[natlas] {p_tok} prompt + {c_tok} reply tokens in {time.monotonic() - started:.1f}s", flush=True)
    return {
        "id": "chatcmpl-" + uuid.uuid4().hex[:24],
        "object": "chat.completion",
        "created": int(time.time()),
        "model": settings.natlas_model,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": reply}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": p_tok, "completion_tokens": c_tok, "total_tokens": p_tok + c_tok},
    }


@app.post("/asr/auto", dependencies=[Depends(_require_key)])
async def asr_auto(request: Request, hint: str = "en") -> dict:
    """Whichever NCAIR language is being spoken: {text, language, score, tried}."""
    audio = await request.body()
    if not audio:
        raise HTTPException(status_code=400, detail="send the audio as the request body")
    started = time.monotonic()
    out = asr.transcribe_auto(audio, hint)
    print(f"[asr] auto hint={hint} -> {out['language']} (score {out['score']}, tried {out['tried']}) "
          f"in {time.monotonic() - started:.1f}s", flush=True)
    return out


@app.post("/asr/{lang}", dependencies=[Depends(_require_key)])
async def asr_endpoint(lang: str, request: Request) -> dict:
    audio = await request.body()
    if not audio:
        raise HTTPException(status_code=400, detail="send the audio as the request body")
    return {"text": asr.transcribe(audio, lang), "language": lang}


@app.post("/tts", dependencies=[Depends(_require_key)])
async def tts_endpoint(request: Request) -> dict:
    body = await request.json()
    text = str(body.get("inputs") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="no text to speak")
    params = body.get("parameters") or {}
    language = str(params.get("language") or "en").lower()
    wav, voice = tts.synthesize(text, language, params.get("voice"))
    return {
        "audio": base64.b64encode(wav).decode("ascii"),
        "sample_rate": tts.SAMPLE_RATE,
        "voice": voice,
        "language": language,
    }


@app.get("/admin/log", dependencies=[Depends(_require_key)])
def admin_log(lines: int = 200) -> Response:
    """The tail of this server's log, so the operator can diagnose without the notebook."""
    path = os.environ.get("NAIC_LOG_PATH", "")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="no log file (NAIC_LOG_PATH unset)")
    with open(path, encoding="utf-8", errors="replace") as fh:
        tail = fh.readlines()[-max(1, min(lines, 2000)):]
    return Response(content="".join(tail), media_type="text/plain")


@app.post("/admin/tts", dependencies=[Depends(_require_key)])
async def admin_tts(request: Request) -> dict:
    """Switch the voice model's compiled decode path on or off without a restart."""
    body = await request.json()
    mode = str(body.get("mode") or "cudagraphs")
    return {"compiled": tts.set_compile(bool(body.get("compile")), mode), "mode": mode}


@app.post("/admin/update", dependencies=[Depends(_require_key)])
def admin_update() -> dict:
    """Pull the latest code from this repository and restart the server in place.

    The process replaces itself, so the tunnel and its URL stay up while the
    models reload from the local cache (a few minutes). Only the repository the
    notebook cloned is pulled; nothing else can be fetched or run.
    """
    import subprocess
    import sys

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pull = subprocess.run(["git", "-C", root, "pull", "--ff-only"], capture_output=True, text=True, timeout=120)
    if pull.returncode != 0:
        raise HTTPException(status_code=500, detail="git pull failed: " + (pull.stderr or pull.stdout)[-400:])
    head = subprocess.run(["git", "-C", root, "log", "--oneline", "-1"], capture_output=True, text=True).stdout.strip()

    def restart() -> None:
        time.sleep(1.0)  # let this response reach the caller first
        print(f"[admin] restarting on {head}", flush=True)
        os.execv(sys.executable, [sys.executable, "-m", "uvicorn", *sys.argv[1:]])

    threading.Thread(target=restart, daemon=True).start()
    return {"pulled": pull.stdout.strip()[-400:], "head": head, "restarting": True}


def _xml_escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# The demo page, served from the same origin so one tunnel URL is the whole demo.
_WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
if os.path.isdir(_WEB):
    app.mount("/", StaticFiles(directory=_WEB, html=True), name="web")
