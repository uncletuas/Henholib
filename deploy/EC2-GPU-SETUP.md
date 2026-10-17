# Serving N-ATLaS on an AWS GPU box

The 8B model runs on one `g5.2xlarge` (NVIDIA A10G, 24 GB) in `us-east-1`,
account `703592322789` (profile `letify`). vLLM serves it on an
OpenAI-compatible endpoint; the FastAPI service in `../server` calls that.

## 0. Quota first (the long pole)

New accounts often have **0** quota for G instances, and the increase is not
instant. Request it before anything else:

```sh
AWS_PROFILE=letify aws service-quotas request-service-quota-increase \
  --service-code ec2 --region us-east-1 \
  --quota-code L-DB2E81BA \
  --desired-value 8      # "Running On-Demand G and VP instances", in vCPUs
```

Check status with `get-requested-service-quota-change`. If it will not clear in
time, serve the same weights from a Hugging Face Inference Endpoint instead and
set `NATLAS_BASE_URL` to that URL -- no code change.

## 1. Launch the instance

- AMI: Deep Learning OSS Nvidia Driver AMI (Ubuntu 22.04) -- CUDA preinstalled.
- Type: `g5.2xlarge`. Disk: 100 GB gp3 (weights are ~16 GB).
- Security group: open 8000 only to the Loopital API box / your IP, not the world.

## 2. Serve N-ATLaS with vLLM

```sh
python3 -m venv ~/vllm && source ~/vllm/bin/activate
pip install vllm==0.6.6
export HF_TOKEN=hf_xxx            # the token that accepted the N-ATLaS terms
python -m vllm.entrypoints.openai.api_server \
  --model NCAIR1/N-ATLaS \
  --served-model-name NCAIR1/N-ATLaS \
  --max-model-len 8092 \
  --dtype bfloat16 \
  --port 8000
```

This exposes `http://<box>:8000/v1/chat/completions`. Smoke test:

```sh
curl -s http://127.0.0.1:8000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"NCAIR1/N-ATLaS","messages":[{"role":"user","content":"Bawo ni?"}]}'
```

## 3. Run the orchestration API (same box or the existing Loopital box)

```sh
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
#   NATLAS_BASE_URL=http://127.0.0.1:8000/v1
#   NATLAS_STUB=0   ASR_STUB=0   ASR_DEVICE=cuda:0   HF_TOKEN=hf_xxx
uvicorn main:app --host 0.0.0.0 --port 8080
```

## 4. Expose it

Proxy `https://naic.loopital.com/api/*` (or a path on the main site) to
`:8080` via the hand-managed nginx vhost on the existing box. The web demo and
the Twilio WhatsApp webhook both call that public URL.

## Cost control

Stop the g5 when not demoing (`aws ec2 stop-instances`). On-demand g5.2xlarge is
roughly 1.2 USD/hr; a few hours of testing plus the finals demo is a small bill.
