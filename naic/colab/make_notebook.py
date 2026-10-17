"""Builds NAIC_N-ATLaS_Voice.ipynb. Edit the cells here, then: python make_notebook.py"""
import json
import os

cells = []


def md(s):
    cells.append({"cell_type": "markdown", "metadata": {}, "source": s.strip("\n").splitlines(True)})


def code(s):
    cells.append(
        {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": s.strip("\n").splitlines(True)}
    )


md(r"""
# Loopital Doc on N-ATLaS: listen, think, speak (free GPU)

**NAIC 2026, Track 02 Voice-First Access.** This notebook runs the whole sovereign voice pipeline on a free Colab or Kaggle GPU and gives it a public URL:

| Step | Model | Source |
|---|---|---|
| Listen (speech to text) | NCAIR ASR: Nigerian English, Yoruba, Igbo, Hausa | `NCAIR1/*-ASR`, `NCAIR1/NigerianAccentedEnglish` |
| Think (understand + answer) | **N-ATLaS 8B**, NCAIR's official weights, loaded in 4-bit | `NCAIR1/N-ATLaS` |
| Speak (text to speech) | YarnGPT2b, Nigerian-accented (NCAIR publishes no TTS) | `saheedniyi/YarnGPT2b` |

**Before you start**
1. `Runtime > Change runtime type > T4 GPU` (Kaggle: Accelerator GPU T4, Internet on).
2. A Hugging Face **read token** whose account has accepted the licence on [N-ATLaS](https://huggingface.co/NCAIR1/N-ATLaS) and the four NCAIR ASR models. Add it as a Colab secret named `HF_TOKEN` (key icon on the left), or paste it when asked.
3. `Runtime > Run all`. The first run downloads about 22 GB and takes 10 to 15 minutes.

Powered by N-ATLaS, Awarri Technologies and the Federal Ministry of Communications, Innovation and Digital Economy.
""")

code(r"""
# 1. Check the GPU and pick a working folder (Colab or Kaggle).
import os, subprocess, sys
print(subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
                     capture_output=True, text=True).stdout or "NO GPU: switch the runtime to a T4 GPU first.")
WORK = "/kaggle/working" if os.path.isdir("/kaggle/working") else "/content"
os.chdir(WORK)
print("working in", WORK)
""")

code(r"""
# 2. Get the code and install what the GPU stack needs (about 2 minutes).
def sh(cmd):
    print("$", cmd)
    subprocess.run(cmd, shell=True, check=True)

sh("rm -rf Henholib && git clone -q --depth 1 -b consolidate-loopital https://github.com/uncletuas/Henholib.git")
SERVER = os.path.join(WORK, "Henholib", "naic", "server")
VENDOR = os.path.join(SERVER, "vendor")
sh(f"mkdir -p {VENDOR} && git clone -q --depth 1 https://github.com/saheedniyi02/yarngpt.git {VENDOR}/yarngpt")
# outetts imports sounddevice, which cannot even be imported without PortAudio.
sh("apt-get -qq install -y libportaudio2 ffmpeg > /dev/null")
sh(f"{sys.executable} -m pip install -q -r {SERVER}/requirements-gpu.txt")
""")

code(r"""
# 3. Credentials. HF_TOKEN pulls NCAIR's gated weights; NAIC_API_KEY protects the
#    machine endpoints that Loopital (henholib.loopital.com) calls.
import getpass, secrets, urllib.request, urllib.error

def secret(name):
    try:
        from google.colab import userdata
        return userdata.get(name)
    except Exception:
        pass
    try:
        from kaggle_secrets import UserSecretsClient
        return UserSecretsClient().get_secret(name)
    except Exception:
        pass
    return os.environ.get(name)

HF_TOKEN = secret("HF_TOKEN") or getpass.getpass("Hugging Face read token: ")
NAIC_API_KEY = secret("NAIC_API_KEY") or secrets.token_urlsafe(24)

# Fail early and clearly if a licence has not been accepted, not 10 minutes in.
for repo in ["NCAIR1/N-ATLaS", "NCAIR1/NigerianAccentedEnglish", "NCAIR1/Yoruba-ASR", "NCAIR1/Igbo-ASR", "NCAIR1/Hausa-ASR"]:
    req = urllib.request.Request(f"https://huggingface.co/{repo}/resolve/main/config.json",
                                 headers={"Authorization": f"Bearer {HF_TOKEN}"})
    try:
        urllib.request.urlopen(req, timeout=30)
        print("ok  ", repo)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{repo}: HTTP {e.code}. Accept the licence at https://huggingface.co/{repo} "
                         "with the account that owns this token, then run this cell again.")
""")

code(r"""
# 4. The audio codec YarnGPT2b was trained with (the exact file its model card uses).
CODEC_DIR = os.path.join(VENDOR, "wavtokenizer")
os.makedirs(CODEC_DIR, exist_ok=True)
CODEC_CFG = os.path.join(CODEC_DIR, "wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml")
CODEC_CKPT = os.path.join(CODEC_DIR, "wavtokenizer_large_speech_320_24k.ckpt")
if not os.path.exists(CODEC_CFG):
    sh(f"wget -q -O {CODEC_CFG} https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/"
       "wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml")
if not os.path.exists(CODEC_CKPT) or os.path.getsize(CODEC_CKPT) < 1e8:
    try:
        sh(f"gdown -q 1-ASeEkrn4HY49yZWHTASgfGFNXdVnLTt -O {CODEC_CKPT}")
    except subprocess.CalledProcessError:
        # Google Drive rate-limits popular files. The same codec family is on HF; it is
        # the fallback because it is not the exact checkpoint the voice was trained with.
        print("Google Drive refused the download; using the Hugging Face copy instead.")
        sh(f"wget -q -O {CODEC_CKPT} https://huggingface.co/novateur/WavTokenizer-large-speech-75token/resolve/main/"
           "wavtokenizer_large_speech_320_v2.ckpt")
print(round(os.path.getsize(CODEC_CKPT) / 1e6), "MB codec ready")
""")

code(r"""
# 5. Start the server and load every model onto the GPU (8 to 12 minutes the first time).
import time, json
env = dict(os.environ,
    HF_TOKEN=HF_TOKEN, NAIC_API_KEY=NAIC_API_KEY,
    NATLAS_BACKEND="local", NATLAS_STUB="0", ASR_STUB="0", TTS_STUB="0",
    ASR_DEVICE="cuda:0", NAIC_PRELOAD="1",
    YARNGPT_DIR=VENDOR, WAVTOKENIZER_CONFIG=CODEC_CFG, WAVTOKENIZER_CKPT=CODEC_CKPT,
    NAIC_DATA_DIR=os.path.join(WORK, "naic-data"),
)
subprocess.run("pkill -f 'uvicorn main:app'", shell=True)
time.sleep(2)

# Colab's own Jupyter server owns 8080, so take the first free port from a list.
import socket
def free(port):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) != 0
PORT = next(p for p in (7860, 7861, 8765, 9000, 9100) if free(p))
BASE = f"http://127.0.0.1:{PORT}"
print("server port", PORT)

LOG = os.path.join(WORK, "server.log")
server = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(PORT)],
                          cwd=SERVER, env=env, stdout=open(LOG, "w"), stderr=subprocess.STDOUT)

def health():
    try:
        return json.load(urllib.request.urlopen(BASE + "/healthz", timeout=5))
    except Exception:
        return None

start = time.time()
while True:
    h = health()
    state = (h or {}).get("warmup", {}).get("state", "starting")
    print(f"\r{int(time.time() - start):4d}s  {state}      ", end="")
    if state == "ready":
        print("\nAll models loaded:", json.dumps({k: h[k]["mode"] for k in ("natlas", "asr", "tts")}))
        break
    if state == "failed" or server.poll() is not None:
        print("\nFAILED:", (h or {}).get("warmup"), "\n--- last log lines ---")
        print(open(LOG).read()[-4000:])
        raise SystemExit("see the log above")
    time.sleep(10)
""")

code(r"""
# 6. Public URL (free Cloudflare quick tunnel, no account needed).
import re
CF = os.path.join(WORK, "cloudflared")
if not os.path.exists(CF):
    sh(f"wget -q -O {CF} https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && chmod +x {CF}")
subprocess.run("pkill -f 'cloudflared tunnel'", shell=True)
CF_LOG = os.path.join(WORK, "tunnel.log")
tunnel = subprocess.Popen(f"{CF} tunnel --no-autoupdate --url {BASE} > {CF_LOG} 2>&1", shell=True)
URL = None
for _ in range(60):
    time.sleep(2)
    m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", open(CF_LOG).read())
    if m:
        URL = m.group(0)
        break
if not URL:
    raise SystemExit("tunnel did not come up:\n" + open(CF_LOG).read()[-2000:])

print("Voice demo (open on a phone or laptop):", URL)
print("\nTo point henholib.loopital.com at this GPU, send the operator these lines:\n")
print(f"NCAIR_LLM_BASE_URL={URL}/v1")
print(f"NCAIR_LLM_API_KEY={NAIC_API_KEY}")
print("NCAIR_LLM_MODEL=NCAIR1/N-ATLaS")
print("NCAIR_LLM_TOOLS=off")
print("NCAIR_SPEECH_PROVIDER=self")
print(f"NCAIR_HF_TOKEN={NAIC_API_KEY}")
print(f"NCAIR_ASR_URLS=en={URL}/asr/en,pcm={URL}/asr/en,yo={URL}/asr/yo,ig={URL}/asr/ig,ha={URL}/asr/ha")
print(f"NCAIR_TTS_URL={URL}/tts")
""")

code(r"""
# 7. Proof it works end to end: N-ATLaS answers in Yoruba, the Nigerian voice speaks it,
#    and NCAIR's Yoruba ASR transcribes the spoken answer back. Timings are printed.
import base64
import IPython.display as ipd

def post(path, payload=None, raw=None, ctype="application/json"):
    data = raw if raw is not None else json.dumps(payload).encode()
    req = urllib.request.Request(BASE + path, data=data,
                                 headers={"Authorization": f"Bearer {NAIC_API_KEY}", "Content-Type": ctype})
    t = time.time()
    out = json.load(urllib.request.urlopen(req, timeout=300))
    return out, time.time() - t

# "My child has had a fever for three days and won't eat. What should I do?"
question = "Ọmọ mi ní ibà fún ọjọ́ mẹ́ta, kò sì jẹun. Kí ni kí n ṣe?"
chat, t1 = post("/v1/chat/completions", {"messages": [
    {"role": "system", "content": "You are a health assistant powered by N-ATLaS. Answer in Yoruba in two or three "
                                  "short sentences. For danger signs, tell the user to go to a clinic."},
    {"role": "user", "content": question}]})
answer = chat["choices"][0]["message"]["content"]
print(f"N-ATLaS ({t1:.1f}s):", answer)

spoken, t2 = post("/tts", {"inputs": answer, "parameters": {"language": "yo"}})
wav = base64.b64decode(spoken["audio"])
print(f"Nigerian voice ({t2:.1f}s): voice={spoken['voice']}")
ipd.display(ipd.Audio(wav, rate=24000))

heard, t3 = post("/asr/yo", raw=wav, ctype="audio/wav")
print(f"NCAIR Yoruba ASR heard it back ({t3:.1f}s):", heard["text"])
""")

md(r"""
### Keep it running
The URL stays live while this notebook runs (free Colab sessions last a few hours; keep the tab open). Every voice turn is logged to `naic-data/interactions.jsonl` as Track 02 validation evidence. The cell below shows the server log and the interaction log.
""")

code(r"""
print(open(LOG).read()[-3000:])
p = os.path.join(WORK, "naic-data", "interactions.jsonl")
print(open(p).read()[-3000:] if os.path.exists(p) else "no interactions yet")
""")

nb = {
    "cells": cells,
    "metadata": {
        "accelerator": "GPU",
        "colab": {"provenance": [], "gpuType": "T4"},
        "kernelspec": {"display_name": "Python 3", "name": "python3"},
        "language_info": {"name": "python"},
    },
    "nbformat": 4,
    "nbformat_minor": 0,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "NAIC_N-ATLaS_Voice.ipynb")
with open(out, "w", encoding="utf-8", newline="\n") as fh:
    json.dump(nb, fh, indent=1, ensure_ascii=False)
print("wrote", out, "with", len(cells), "cells")
