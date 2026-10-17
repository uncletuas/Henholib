# How henholib.loopital.com uses N-ATLaS

henholib.loopital.com is Loopital, a working Nigerian health platform (patient
records, facility finder, appointments, teleconsults), with its assistant **Doc**
running on N-ATLaS. This document describes how Doc reaches the models in this
repository.

## The voice turn

1. The patient opens Doc, taps **Talk to Doc**, picks their language (English,
   Pidgin, Yoruba, Igbo or Hausa) and holds the button to speak.
2. The browser records 16 kHz mono audio and sends one clip to the Loopital API
   (`POST /api/portal/doc/ncair/voice`, signed in, rate limited).
3. The API sends the clip to **NCAIR ASR** for that language (`POST /asr/{lang}`).
4. The transcript goes through Doc's ordinary chat path, not straight to the
   model. That path runs the emergency check first, adds the patient's own
   context (their records, location and the screen they are on) and Doc's
   clinical rules, then asks **N-ATLaS** (`POST /v1/chat/completions`).
5. The N-ATLaS reply is shown as text and voiced in a **Nigerian voice**
   (`POST /tts`). The opening of a long answer is spoken; the whole answer stays
   on screen.
6. If speech fails at any point the patient still gets the written answer. If the
   clip has no speech in it, no model is called at all.

Because step 4 reuses Doc's normal chat path, a voice question gets exactly the
same safety handling as a typed one: danger signs are caught before any model
call, and a rule-based reply is given if the model is unreachable.

## Configuration

The Loopital API reads these settings; nothing is chosen by the patient.

| Setting | Value |
|---|---|
| `NCAIR_LLM_BASE_URL` | `<gpu url>/v1` |
| `NCAIR_LLM_MODEL` | `NCAIR1/N-ATLaS` |
| `NCAIR_LLM_API_KEY` | the GPU's shared key |
| `NCAIR_LLM_TOOLS` | `off` (N-ATLaS answers in plain text) |
| `NCAIR_SPEECH_PROVIDER` | `self` (this repository's ASR and voice) |
| `NCAIR_ASR_URLS` | `en=<gpu>/asr/en,pcm=<gpu>/asr/en,yo=<gpu>/asr/yo,ig=<gpu>/asr/ig,ha=<gpu>/asr/ha` |
| `NCAIR_TTS_URL` | `<gpu>/tts` |
| `NCAIR_HF_TOKEN` | the GPU's shared key, sent as a Bearer token |
| `NCAIR_SPEAK_MAX_CHARS` | `300` (speak the opening, caption the rest) |

The notebook in `colab/` prints these lines, with its own URL and key, once its
tunnel is up.

When the official N-ATLaS speech service (Awarri) issues a key, setting
`NCAIR_SPEECH_API_KEY` moves listening, speaking and automatic language
identification to it, with no code change.

## Attribution

The Loopital UI and this service both show: *Powered by N-ATLaS, Awarri
Technologies and the Federal Ministry of Communications, Innovation and Digital
Economy.*
