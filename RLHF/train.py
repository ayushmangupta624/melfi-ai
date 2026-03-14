"""
DPO Fine-Tuning: Qwen3.0-8B on PsychoCounsel-Preference
=========================================================

Libraries used:
  - transformers     : Model loading, tokenizer, training callbacks
  - trl              : DPOTrainer / DPOConfig for preference optimization
  - peft             : LoRA adapters (QLoRA) to fit on 6x RTX 6000 PRO
  - datasets         : Loading the HuggingFace preference dataset
  - bitsandbytes     : 4-bit quantization for memory efficiency
  - accelerate       : Multi-GPU orchestration 
  - torch            : PyTorch backend
"""

import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    EarlyStoppingCallback,
)
from peft import LoraConfig
from trl import DPOConfig, DPOTrainer
import os 

# ──────────────────────────────────────────────
# 1. CONFIG
# ──────────────────────────────────────────────
MODEL_ID = "Qwen/Qwen3-8B"
DATASET_ID = "Psychotherapy-LLM/PsychoCounsel-Preference"
OUTPUT_DIR = "./qwen3-8b-dpo-psycho"
MAX_LENGTH = 1024
BATCH_SIZE = 2           
GRAD_ACCUM = 4           
EPOCHS = 3
LR = 5e-5
LORA_R = 64
LORA_ALPHA = 128
BETA = 0.1               # DPO temperature

# ──────────────────────────────────────────────
# 2. LOAD TOKENIZER
# ──────────────────────────────────────────────
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# ──────────────────────────────────────────────
# 3. LOAD MODEL (QLoRA – 4-bit)
# ──────────────────────────────────────────────
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    torch_dtype=torch.bfloat16,
    trust_remote_code=True,
    # device_map={"": torch.cuda.current_device()},  # <-- this is the key line
    device_map={"": f"cuda:{int(os.environ.get('LOCAL_RANK', 0))}"},
    # attn_implementation="flash_attention_2",
)
model.enable_input_require_grads() 
# ──────────────────────────────────────────────
# 4. LoRA CONFIG
# ──────────────────────────────────────────────
peft_config = LoraConfig(
    r=LORA_R,
    lora_alpha=LORA_ALPHA,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                     "gate_proj", "up_proj", "down_proj"],
    bias="none",
    task_type="CAUSAL_LM",
)

# ──────────────────────────────────────────────
# 5. LOAD & PREP DATASET
# ──────────────────────────────────────────────
raw = load_dataset(DATASET_ID)
ds = raw["train"].train_test_split(test_size=0.05, seed=42)

def format_row(example):
    """Map dataset columns to DPOTrainer's expected format:
       prompt, chosen, rejected  (all strings)."""
    # Adjust these keys to match the actual dataset schema.
    # Common column names: prompt/question, chosen/preferred, rejected/dispreferred
    #RLHF
    return {
        "prompt":   example.get("prompt")   or example.get("question", ""),
        "chosen":   example.get("chosen")   or example.get("preferred", ""),
        "rejected": example.get("rejected") or example.get("dispreferred", ""),
    }

train_ds = ds["train"].map(format_row)
eval_ds  = ds["test"].map(format_row)

# ──────────────────────────────────────────────
# 6. TRAINING ARGS
# ──────────────────────────────────────────────
training_args = DPOConfig(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRAD_ACCUM,
    learning_rate=LR,
    beta=BETA,
    max_length=MAX_LENGTH,
    max_prompt_length=MAX_LENGTH // 2,
    lr_scheduler_type="cosine",
    warmup_ratio=0.1,
    bf16=True,
    gradient_checkpointing=True,
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=100,
    save_strategy="steps",
    save_steps=100,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    report_to="none",
    seed=42,
    gradient_checkpointing_kwargs={"use_reentrant": False},  
    ddp_find_unused_parameters=False,                        
)

# ──────────────────────────────────────────────
# 7. TRAIN
# ──────────────────────────────────────────────
trainer = DPOTrainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=eval_ds,
    processing_class=tokenizer,
    peft_config=peft_config,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)

trainer.train()

# ──────────────────────────────────────────────
# 8. SAVE
# ──────────────────────────────────────────────
trainer.save_model(f"{OUTPUT_DIR}/final")
tokenizer.save_pretrained(f"{OUTPUT_DIR}/final")
print(f"\n✓ Done. Adapter saved to {OUTPUT_DIR}/final")