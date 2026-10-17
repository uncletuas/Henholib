# Loopital Doc on N-ATLaS: Voice-First Health Access

A National AI Innovation Challenge (NAIC) 2026 entry, **Track 02: Voice-First
Access**. A Nigerian asks a health question **by voice, in their own language**
(English, Pidgin, Yoruba, Igbo or Hausa), and **N-ATLaS** understands it and
answers out loud in a Nigerian voice. No typing, and no English required.

It runs inside Loopital, a live Nigerian health platform, at
**https://henholib.loopital.com**, where it answers with the patient's own
records, nearby facilities and clinical safety rules behind it. Hospitals on
Loopital run **HMS7**, Loopital's hospital management system, so the
appointments and care records their staff keep are the same ones the patient's
voice assistant works from.

> Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of
> Communications, Innovation and Digital Economy. General health guidance only,
> not a diagnosis.

## Try it yourself, free

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/uncletuas/Henholib/blob/master/colab/NAIC_N-ATLaS_Voice.ipynb)

`colab/NAIC_N-ATLaS_Voice.ipynb` runs the whole pipeline on a free Colab or
Kaggle T4 GPU. It loads NCAIR's official N-ATLaS weights in 4-bit, the four NCAIR
speech recognition models and the Nigerian voice, then prints a public link to a
hold-to-speak demo. You need a Hugging Face token whose account has accepted the
N-ATLaS and NCAIR ASR licences.

The notebook's last cell proves the loop and prints timings. From the first run:

| Step | Result | Time |
|---|---|---|
| Question (Yoruba) | *Ọmọ mi ní ibà fún ọjọ́ mẹ́ta, kò sì jẹun. Kí ni kí n ṣe?* ("My child has had a fever for three days and will not eat.") | |
| **N-ATLaS answers in Yoruba** | *...wọn le nilo itọju ilera lẹsẹkẹsẹ. Mu wọn lọ si ile-iwosan...* ("they may need care immediately; take them to a clinic") | 6.8 s |
| Nigerian voice speaks it | `yoruba_female2` | spoken |
| **NCAIR Yoruba ASR hears it back** | *...ọjọ́ mẹ́ta àti ... ìbà ... nílò ... lẹ́sẹ̀kẹsẹ̀ ...* | transcribed |

## The sovereign stack

| Step | Model | Source |
|---|---|---|
| Listen: Nigerian English and Pidgin | NigerianAccentedEnglish | `NCAIR1/NigerianAccentedEnglish` |
| Listen: Yoruba | Yoruba-ASR | `NCAIR1/Yoruba-ASR` |
| Listen: Igbo | Igbo-ASR | `NCAIR1/Igbo-ASR` |
| Listen: Hausa | Hausa-ASR | `NCAIR1/Hausa-ASR` |
| **Understand and answer** | **N-ATLaS 8B** (Llama-3 fine-tune), official weights, 4-bit NF4 | `NCAIR1/N-ATLaS` |
| Speak the answer | YarnGPT2b, Nigerian-accented, Apache 2.0 | `saheedniyi/YarnGPT2b` |

N-ATLaS does all of the understanding and answering. NCAIR publishes no
text-to-speech model, so the finished N-ATLaS sentence is voiced by YarnGPT2b, a
Nigerian model; no reasoning happens there. When the official N-ATLaS speech
service (Awarri) issues an API key, Loopital switches to it with configuration
only.

## Architecture

```
 Phone / browser mic ──┐                           ┌──► spoken reply (Nigerian voice)
 WhatsApp voice note ──┼──► NCAIR ASR ──► N-ATLaS ─┤
 Loopital Doc ─────────┘   (per language)  (answer) └──► text reply + interaction log
```

One FastAPI service (`server/`) hosts all three models on one GPU and exposes:

| Endpoint | Purpose |
|---|---|
| `POST /api/voice` | Full turn: audio in, transcript + N-ATLaS reply + spoken audio out (used by `web/`) |
| `POST /v1/chat/completions` | OpenAI-compatible N-ATLaS chat (used by Loopital Doc) |
| `POST /asr/{lang}` | NCAIR speech recognition: WAV in, text out |
| `POST /tts` | Nigerian voice: text in, base64 WAV out |
| `POST /api/whatsapp` | Twilio WhatsApp webhook |
| `GET /healthz`, `GET /api/stats` | Which models are live, and the interaction count |

The machine endpoints (`/v1`, `/asr`, `/tts`) require a shared key, because the
GPU sits behind a public tunnel. See [docs/HENHOLIB-INTEGRATION.md](docs/HENHOLIB-INTEGRATION.md)
for how henholib.loopital.com uses them.

### Files

- `server/main.py`: routes, the voice turn, and the endpoints above.
- `server/natlas_client.py`, `server/llm_local.py`: the N-ATLaS integration, over
  HTTP (vLLM / hosted endpoint) or loaded in-process in 4-bit.
- `server/asr.py`: NCAIR ASR, one model per language; decodes WAV, WebM and Opus.
- `server/tts.py`: the Nigerian voice, all sentences of a reply decoded in one batch.
- `server/store.py`, `server/tools/make_evidence.py`: the interaction log and its CSV export.
- `web/index.html`: the hold-to-speak demo page, served by the same service.
- `colab/`: the free-GPU notebook (`make_notebook.py` builds it).
- `deploy/EC2-GPU-SETUP.md`: running N-ATLaS on a dedicated GPU server with vLLM.

## Run it without a GPU (stub mode)

Every model has a stub, so the routes and the page can be tried on any laptop:

```sh
cd server
python -m venv .venv && . .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install fastapi "uvicorn[standard]" python-multipart
NATLAS_STUB=1 ASR_STUB=1 TTS_STUB=1 uvicorn main:app --port 7860
# open http://127.0.0.1:7860
```

On a GPU, `pip install -r requirements-gpu.txt` and follow the notebook's steps.

## Validation evidence

Every real voice turn is appended to `naic-data/interactions.jsonl` with its
language, transcript, N-ATLaS reply and latency. Export for the submission:

```sh
cd server && python -m tools.make_evidence > evidence.csv
```

## Licences

N-ATLaS and the NCAIR ASR models are under NCAIR's Open-Source Research and
Innovation Licence (1,000 active-user cap, attribution required, no surveillance,
military or disinformation use). YarnGPT2b is Apache 2.0. This entry sits inside
those terms and carries the required attribution in the API and the UI.
