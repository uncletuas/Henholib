"""Append-only interaction log -- the Voice-First track's validation evidence.

NAIC requires "minimum 50 documented real user interactions" for the
Voice-First track. Every turn is written as one JSON line with a timestamp,
channel, language, the transcript, and the N-ATLaS reply, so the log is the
submittable record of real usage. SQLite would also work; JSONL keeps the
evidence trivially inspectable and exportable to CSV for the submission.
"""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
from datetime import datetime, timezone

from config import settings

_lock = threading.Lock()


def _path() -> str:
    os.makedirs(settings.data_dir, exist_ok=True)
    return os.path.join(settings.data_dir, "interactions.jsonl")


def log_interaction(
    *,
    channel: str,
    language: str,
    transcript: str,
    reply: str,
    user_ref: str = "",
    latency_ms: int | None = None,
) -> dict:
    record = {
        "id": uuid.uuid4().hex,
        "ts": datetime.now(timezone.utc).isoformat(),
        "channel": channel,          # "web" | "whatsapp"
        "language": language,
        "user_ref": user_ref,        # hashed phone / session id, never raw PII
        "transcript": transcript,
        "reply": reply,
        "latency_ms": latency_ms,
    }
    line = json.dumps(record, ensure_ascii=False)
    with _lock:
        with open(_path(), "a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    return record


def count() -> int:
    try:
        with open(_path(), encoding="utf-8") as fh:
            return sum(1 for _ in fh)
    except FileNotFoundError:
        return 0


def stats() -> dict:
    """Per-language and per-channel counts for the validation dashboard."""
    by_lang: dict[str, int] = {}
    by_channel: dict[str, int] = {}
    total = 0
    try:
        with open(_path(), encoding="utf-8") as fh:
            for raw in fh:
                try:
                    rec = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                total += 1
                by_lang[rec.get("language", "?")] = by_lang.get(rec.get("language", "?"), 0) + 1
                by_channel[rec.get("channel", "?")] = by_channel.get(rec.get("channel", "?"), 0) + 1
    except FileNotFoundError:
        pass
    return {"total": total, "by_language": by_lang, "by_channel": by_channel}
