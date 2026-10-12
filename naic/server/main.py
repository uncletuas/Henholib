"""NAIC 2026 Voice-First service -- FastAPI orchestration.

Flow: voice note (web mic or WhatsApp) -> NCAIR ASR -> N-ATLaS -> reply.
Endpoints:
  GET  /healthz           liveness + which components are live vs stub
  POST /api/transcribe    audio -> text (NCAIR ASR only)
  POST /api/chat          text -> N-ATLaS reply (no audio)
  POST /api/voice         audio -> {transcript, reply}  (the full pipeline)
  POST /api/whatsapp      Twilio webhook (voice note or text) -> TwiML reply
  GET  /api/stats         interaction counts for the validation dashboard

Built on Loopital for the National AI Innovation Challenge (NAIC) 2026.
Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of
Communications, Innovation and Digital Economy.
"""
from __future__ import annotations

import hashlib
import time

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

import asr
import natlas_client as natlas
import store
from config import LANGUAGE_NAMES, settings

app = FastAPI(title="Loopital NAIC Voice-First", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the loopital.com origin before submission
    allow_methods=["*"],
    allow_headers=["*"],
)


def _lang_name(code: str) -> str:
    return LANGUAGE_NAMES.get(code, "Nigerian English")


def _run_pipeline(audio_bytes: bytes, language: str, channel: str, user_ref: str) -> dict:
    started = time.monotonic()
    transcript = asr.transcribe(audio_bytes, language)
    reply = natlas.chat(
        [{"role": "user", "content": transcript}],
        language=_lang_name(language),
    )
    latency = int((time.monotonic() - started) * 1000)
    store.log_interaction(
        channel=channel,
        language=language,
        transcript=transcript,
        reply=reply,
        user_ref=user_ref,
        latency_ms=latency,
    )
    return {"transcript": transcript, "reply": reply, "latency_ms": latency}


@app.get("/healthz")
def healthz() -> dict:
    return {
        "ok": True,
        "natlas": natlas.health(),
        "asr": asr.health(),
        "interactions": store.count(),
    }


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("en")) -> dict:
    text = asr.transcribe(await audio.read(), language)
    return {"transcript": text, "language": language}


@app.post("/api/chat")
async def chat(message: str = Form(...), language: str = Form("en")) -> dict:
    reply = natlas.chat(
        [{"role": "user", "content": message}], language=_lang_name(language)
    )
    store.log_interaction(
        channel="web", language=language, transcript=message, reply=reply, user_ref="text"
    )
    return {"reply": reply}


@app.post("/api/voice")
async def voice(audio: UploadFile = File(...), language: str = Form("en")) -> dict:
    return _run_pipeline(await audio.read(), language, channel="web", user_ref="web")


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
            import base64

            token = base64.b64encode(
                f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode()
            ).decode()
            auth = {"Authorization": f"Basic {token}"}
        req = _r.Request(media_url, headers=auth or {})
        with _r.urlopen(req, timeout=60) as resp:
            audio_bytes = resp.read()
        result = _run_pipeline(audio_bytes, language, channel="whatsapp", user_ref=user_ref)
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


def _xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
