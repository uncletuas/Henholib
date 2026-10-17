# Loopital x NAIC 2026 — Voice-First Health Access

A National AI Innovation Challenge (NAIC) 2026 entry, **Track 02: Voice-First
Access**. A Nigerian can ask a basic health question **by voice, in their own
language**, over WhatsApp or the web, and get an answer back from **N-ATLaS**.
No typing, no English required.

> Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of
> Communications, Innovation and Digital Economy. General guidance only, not
> medical advice.

## Run it yourself, free, on a GPU

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/uncletuas/Henholib/blob/consolidate-loopital/naic/colab/NAIC_N-ATLaS_Voice.ipynb)

`colab/NAIC_N-ATLaS_Voice.ipynb` runs the whole pipeline on a free Colab or
Kaggle T4: it loads NCAIR's official N-ATLaS weights in 4-bit, the four NCAIR
ASR models and the Nigerian voice, then prints a public URL with a hold-to-speak
demo. You need a Hugging Face token whose account has accepted the N-ATLaS and
NCAIR ASR licences. The last cell proves the loop: N-ATLaS answers a Yoruba
question in Yoruba, the voice speaks it, and NCAIR's Yoruba ASR transcribes the
spoken answer back, with timings.

The same URL also serves the endpoints the Loopital app calls
(`/v1/chat/completions`, `/asr/{lang}`, `/tts`), so henholib.loopital.com can use
this GPU with configuration only.

## Why this fits the track

Millions of Nigerians do not type fluently in English but speak Yoruba, Hausa,
Igbo or Pidgin. This turns a voice note into a sovereign-AI answer, built end to
end on NCAIR's own models.

## The sovereign stack (everything is NCAIR's)

| Step | Model | Repo |
|---|---|---|
| Speech to text (Yoruba) | Yoruba-ASR | `NCAIR1/Yoruba-ASR` |
| Speech to text (Hausa) | Hausa-ASR | `NCAIR1/Hausa-ASR` |
| Speech to text (Igbo) | Igbo-ASR | `NCAIR1/Igbo-ASR` |
| Speech to text (English/Pidgin) | NigerianAccentedEnglish | `NCAIR1/NigerianAccentedEnglish` |
| Understanding + answer | **N-ATLaS 8B** | `NCAIR1/N-ATLaS` |
| Speaking the answer | YarnGPT2b (Nigerian-accented, Apache 2.0) | `saheedniyi/YarnGPT2b` |

NCAIR publishes no text-to-speech model, so the finished N-ATLaS sentence is
voiced by YarnGPT2b, a Nigerian model. No understanding or answering happens
there. Other non-NCAIR pieces are the transport (WhatsApp via Twilio) and the
GPU host.

## Architecture

```
WhatsApp voice note ─┐
                     ├─► NCAIR ASR ──► N-ATLaS (vLLM on EC2 g5) ──► reply
Web mic (browser) ───┘        │                                      │
                              └──────────── interaction log ─────────┘
                                         (validation evidence)
```

- `server/` — FastAPI orchestration: ASR, the N-ATLaS client, the WhatsApp
  webhook, and the interaction log. Runs in a **stub mode** today so the whole
  flow is demoable before GPU capacity lands; one env var swaps in the real
  model (`NATLAS_STUB=0` + `NATLAS_BASE_URL`).
- `web/` — a one-page voice demo (hold to speak) that also shows the live
  interaction count. Deployable on the existing S3 + CloudFront pipeline.
- `deploy/EC2-GPU-SETUP.md` — standing N-ATLaS up on AWS with vLLM, quota first.

## How this maps to the 7 submission components

1. **Working technical artefact** — this repo + the deployed web demo + the
   WhatsApp number.
2. **N-ATLaS integration doc** — `server/natlas_client.py` is the integration;
   summarise it in the submission (model id, chat template, 8k context).
3. **Real-world validation** — the interaction log is the evidence. Track needs
   **50 documented real user interactions**; export with `make-evidence` below.
4. **Technical documentation** — this README + the deploy guide.
5. **3–5 min video** — script lives in `../naic/VIDEO-SCRIPT.md` (to write).
6. **Team profile** — individual entry, founder ID (per the eligibility choice).
7. **ID documentation** — valid Nigerian ID (individual, Innovation track).

## Run it locally (stub, no GPU)

```sh
cd server
python -m venv .venv && . .venv/Scripts/activate   # or source .venv/bin/activate
pip install fastapi "uvicorn[standard]" python-multipart
cp .env.example .env            # NATLAS_STUB=1 ASR_STUB=1 already set
uvicorn main:app --reload --port 8080
# serve web/ against it:  set window.NAIC_API_BASE = "http://127.0.0.1:8080"
```

Going live: install `requirements.txt` on the GPU box, follow
`deploy/EC2-GPU-SETUP.md`, set `NATLAS_STUB=0 ASR_STUB=0`.

## Export the validation evidence

```sh
python -m tools.make_evidence > evidence.csv   # every interaction as a CSV row
```

## License note

N-ATLaS and the ASR models are under NCAIR's Open-Source Research and Innovation
License (1,000 active-user cap, attribution required, no surveillance/military/
disinformation use). A challenge demo sits inside those terms.
