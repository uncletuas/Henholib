"""Run the N-ATLaS voice service on Modal, serverless and always available.

Why Modal: a free Colab notebook sleeps and its link changes; Modal gives one
stable URL that scales to zero (free while idle) and wakes on the first request.
That suits an unknown judging time with no one keeping a tab open.

Deploy:
    pip install modal
    modal token set --token-id ... --token-secret ...   # once
    modal deploy deploy/modal_app.py

It needs two Modal secrets (create them at modal.com/secrets):
    huggingface-secret   a Hugging Face READ token as HF_TOKEN, whose account
                         has accepted the N-ATLaS and NCAIR ASR licences
    custom-secret        NAIC_API_KEY, the shared key the Loopital app sends

All NCAIR weights are baked into the image at build time, so a cold start loads
them from local disk (a minute or two) instead of downloading 16 GB again.

Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of
Communications, Innovation and Digital Economy.
"""
import os

import modal

SERVER = os.path.join(os.path.dirname(__file__), "..", "server")
WEB = os.path.join(os.path.dirname(__file__), "..", "web")
GATED = ["NCAIR1/N-ATLaS", "NCAIR1/NigerianAccentedEnglish", "NCAIR1/Yoruba-ASR", "NCAIR1/Igbo-ASR", "NCAIR1/Hausa-ASR", "saheedniyi/YarnGPT2b"]

app = modal.App("henholib-natlas")
hf = modal.Secret.from_name("huggingface-secret")
naic = modal.Secret.from_name("custom-secret")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "ffmpeg", "libportaudio2", "wget")
    .pip_install(
        "fastapi==0.115.6", "uvicorn[standard]==0.34.0", "python-multipart==0.0.20",
        "torch==2.5.1", "torchaudio==2.5.1", "transformers==4.48.0", "bitsandbytes==0.44.1", "accelerate>=0.33.0",
        "huggingface_hub>=0.25", "hf_transfer", "soundfile", "librosa",
        "outetts==0.2.3", "uroman", "inflect", "gdown",
    )
    # The Nigerian voice: the YarnGPT repo plus the WavTokenizer codec its card uses.
    .run_commands(
        "git clone --depth 1 https://github.com/saheedniyi02/yarngpt.git /opt/vendor/yarngpt",
        "wget -q -O /opt/vendor/wavtokenizer.yaml https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml",
        "gdown -q 1-ASeEkrn4HY49yZWHTASgfGFNXdVnLTt -O /opt/vendor/wavtokenizer.ckpt"
        " || wget -q -O /opt/vendor/wavtokenizer.ckpt https://huggingface.co/novateur/WavTokenizer-large-speech-75token/resolve/main/wavtokenizer_large_speech_320_v2.ckpt",
    )
    # Bake NCAIR's gated weights into the image so cold starts never download them.
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_commands(
        "python -c \"from huggingface_hub import snapshot_download as d; "
        + "".join(f"d('{r}');" for r in GATED)
        + "\"",
        secrets=[hf],
    )
    .env({
        "NATLAS_BACKEND": "local", "NATLAS_STUB": "0", "ASR_STUB": "0", "TTS_STUB": "0",
        "TTS_ENABLED": "1", "ASR_DEVICE": "cuda:0", "NATLAS_MAX_NEW_TOKENS": "160",
        "YARNGPT_DIR": "/opt/vendor",
        "WAVTOKENIZER_CONFIG": "/opt/vendor/wavtokenizer.yaml",
        "WAVTOKENIZER_CKPT": "/opt/vendor/wavtokenizer.ckpt",
        "NAIC_DATA_DIR": "/tmp/naic-data",
    })
    # Code last, so editing the server redeploys without rebuilding the models.
    .add_local_dir(SERVER, "/app/server")
    .add_local_dir(WEB, "/app/web")
)


@app.function(
    image=image,
    gpu="L4",  # 24 GB, about twice a free T4, fits N-ATLaS + the four ASR models + the voice
    secrets=[hf, naic],
    scaledown_window=1200,  # stay warm 20 min after the last request, so an active judging session stays warm
    timeout=900,
    max_containers=1,  # one GPU; the server serialises model use with its own locks
)
@modal.concurrent(max_inputs=8)
@modal.asgi_app()
def serve():
    import sys

    sys.path.insert(0, "/app/server")
    # Load every model before returning the app, so the first request after a
    # cold start waits for a ready model instead of getting a stub answer.
    import asr
    import llm_local
    import main
    import tts

    llm_local.load()
    for code in ("en", "yo", "ig", "ha"):
        asr.transcribe_warm(code)
    tts.load()
    print("[modal] all models loaded, serving", flush=True)
    return main.app
