"""N-ATLaS loaded into this process, for a single free GPU (Colab / Kaggle T4).

The official NCAIR1/N-ATLaS weights are Llama-3 8B in 16-bit (about 16 GB), which
does not fit a 15 GB T4. Loaded in 4-bit NF4 they take about 6 GB, leaving room
for the four NCAIR ASR models and the voice. These are NCAIR's own weights, pulled
from NCAIR's own repository, not a third-party copy.

One GPU means one generation at a time, so calls are serialised with a lock.
"""
from __future__ import annotations

import threading

from config import settings

_lock = threading.Lock()
_model = None
_tokenizer = None
_eos_ids: list[int] = []


def load() -> None:
    global _model, _tokenizer, _eos_ids
    if _model is not None:
        return
    import torch  # type: ignore
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig  # type: ignore

    token = settings.hf_token or None
    _tokenizer = AutoTokenizer.from_pretrained(settings.natlas_model, token=token)
    _model = AutoModelForCausalLM.from_pretrained(
        settings.natlas_model,
        token=token,
        device_map="auto",
        low_cpu_mem_usage=True,
        quantization_config=BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        ),
    )
    _model.eval()
    # Llama-3 ends a turn with <|eot_id|>, not the base end-of-text token; without
    # it in the stop list the model talks on past its own answer.
    ids = {_tokenizer.eos_token_id}
    eot = _tokenizer.convert_tokens_to_ids("<|eot_id|>")
    if isinstance(eot, int) and eot != _tokenizer.unk_token_id:
        ids.add(eot)
    _eos_ids = [i for i in ids if i is not None]


def _render(messages: list[dict]) -> str:
    if getattr(_tokenizer, "chat_template", None):
        return _tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    # The Llama-3 instruct format, should the tokenizer ship without a template.
    out = "<|begin_of_text|>"
    for m in messages:
        out += f"<|start_header_id|>{m['role']}<|end_header_id|>\n\n{m['content']}<|eot_id|>"
    return out + "<|start_header_id|>assistant<|end_header_id|>\n\n"


def generate(messages: list[dict], max_new_tokens: int | None = None, temperature: float = 0.3) -> tuple[str, int, int]:
    """Return (reply, prompt_tokens, completion_tokens)."""
    import torch  # type: ignore

    load()
    limit = min(max_new_tokens or settings.natlas_max_new_tokens, settings.natlas_max_new_tokens)
    prompt = _render(messages)
    inputs = _tokenizer(prompt, return_tensors="pt", add_special_tokens=False).to(_model.device)
    with _lock, torch.inference_mode():
        out = _model.generate(
            **inputs,
            max_new_tokens=limit,
            do_sample=temperature > 0,
            temperature=max(temperature, 1e-3),
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=_eos_ids,
            pad_token_id=_eos_ids[0],
        )
    new = out[0][inputs["input_ids"].shape[-1]:]
    text = _tokenizer.decode(new, skip_special_tokens=True).strip()
    return text, int(inputs["input_ids"].shape[-1]), int(new.shape[-1])


def loaded() -> bool:
    return _model is not None
