## Top 10 Finalist at GenAI Genesis 2026!

## Inspiration: Human Empowerment!

Melfi started with our own personal challenges: needing support and someone to talk to. Traditional therapy is often expensive and inaccessible for many, and there was a need for a tool that fills this gap while feeling real and present. With Melfi, users can feel more empowered in their lives by having a safe space to process their emotions. 


## What it does

Melfi is an AI therapist that calls you on your phone for a conversation. It remembers what you've talked about across sessions, adapts its approach based on what you share, and visualizes your emotional history as a navigable 3D terrain. This allows you to zoom out and visually see your low points, breakthroughs, all the slow, hard work in between. 

## Technical Specifications

 
### Architecture
 
```
┌─────────────────────────────────────────────────────────────────────┐
│                          User's Phone                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ PSTN outbound call
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            Vapi.ai                                   │
│                                                                      │
│   Twilio (dial-out) → Deepgram nova-2 (STT) → ElevenLabs (TTS)     │
│                              │                                       │
│                    conversation turns                                │
│                              │                                       │
│                              ▼                                       │
│              POST /v1/chat/completions                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ OpenAI-compatible API
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Self-hosted Model Server                         │
│                                                                      │
│   Qwen3-8B (RLHF/DPO fine-tuned) served via vllm                   │
│   Exposed over Cloudflare Tunnel (HTTPS)                            │
└─────────────────────────────────────────────────────────────────────┘
 
                    ── call ends ──
 
┌─────────────────────────────────────────────────────────────────────┐
│                      Vapi Webhook                                    │
│              POST /api/vapi/webhook (Next.js)                       │
│                                                                      │
│   end-of-call-report → full transcript → trigger post-processing   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Post-call Pipeline                                │
│                   /api/calls/process                                 │
│                                                                      │
│  1. Groq (Llama 3.1 8B)                                             │
│     └─ mood score, sentiment variance, session label,               │
│        themes, named entities, memory summary                       │
│                                                                      │
│  2. Hugging Face Inference API                                       │
│     └─ sentence-transformers/all-MiniLM-L6-v2                      │
│        → 384-dim embedding of memory summary                        │
│                                                                      │
│  3. Supabase                                                         │
│     ├─ UPDATE calls (mood_score, session_label, ...)                │
│     └─ INSERT memory_chunks (content + vector embedding)            │
└─────────────────────────────────────────────────────────────────────┘
 
                    ── next call ──
 
┌─────────────────────────────────────────────────────────────────────┐
│                    Memory Retrieval (RAG)                            │
│                   /api/calls/initiate                                │
│                                                                      │
│   SELECT content FROM memory_chunks                                 │
│   ORDER BY embedding <=> query_vector   ← cosine similarity        │
│   LIMIT 5                                                            │
│                                                                      │
│   → injected into Vapi system prompt as {{memory}}                 │
└─────────────────────────────────────────────────────────────────────┘
```
 
### The Model
 
The conversational AI is a **Qwen3-8B** model fine-tuned using **Reinforcement Learning from Human Feedback (RLHF)** via the **Direct Preference Optimization (DPO)** algorithm on the **Psychotherapy-LLM dataset** (36,000 rows of real therapist-client dialogue). DPO trains the model by directly optimizing on preference pairs — responses rated more therapeutically effective are reinforced, less effective ones are pushed away — without requiring a separate reward model.
 
The result is a model that has internalized therapeutic techniques including reflective listening, Socratic questioning, cognitive reframing, and somatic grounding, rather than just following instructions to use them.
 
Chain-of-thought reasoning is disabled at the server level for low-latency voice response. The model is self-hosted on our own server, served via **vllm** (OpenAI-compatible `/v1/chat/completions` endpoint), and exposed over HTTPS via **Cloudflare Tunnel**.
 
### Voice Pipeline
 
| Stage | Technology | Role |
|-------|-----------|------|
| Call initiation | Vapi + Twilio | Outbound PSTN dial to user's real phone number |
| Speech-to-text | Deepgram nova-2 | Real-time streaming transcription |
| Language model | Qwen3-8B (self-hosted) | Therapeutic response generation |
| Text-to-speech | ElevenLabs | Neural voice synthesis |
| Orchestration | Vapi.ai | Manages the full call lifecycle and webhook events |
 
### Memory System
 
After each call ends, Vapi fires an `end-of-call-report` webhook containing the full transcript. The post-call pipeline runs asynchronously:
 
1. **Transcript analysis** — Groq (Llama 3.1 8B Instant, JSON mode) extracts structured data: mood score (1–10), sentiment variance (0–1), primary therapeutic technique, session label, recurring themes, named entities, and a 1–2 sentence memory summary.
 
2. **Embedding** — The memory summary is embedded via the Hugging Face Inference API using `sentence-transformers/all-MiniLM-L6-v2`, producing a 384-dimensional vector.
 
3. **Storage** — The embedding and raw text are stored in Supabase's `memory_chunks` table with a `vector(384)` column indexed using **HNSW** (`vector_cosine_ops`) for fast approximate nearest-neighbour search.
 
4. **Retrieval** — Before the next call, the 5 most semantically relevant memory chunks are retrieved via cosine similarity search and injected into the system prompt. The model walks into every call already knowing the user's context.
 
### Emotional Terrain Visualization
 
The dashboard renders the user's call history as a navigable **Three.js** heightmap:
 
- **X axis** — time (each call is a column of vertices)
- **Y axis** — emotional volatility (high volatility = tall, turbulent ridge)
- **Z axis** — mood (high mood = wide, gentle hill; low mood = narrow, pinched spike)
 
The terrain uses a custom **GLSL ShaderMaterial** with:
- Per-vertex mood and volatility attributes interpolated smoothly between sessions
- Animated topographic contour lines flowing across the surface in the fragment shader
- Simplex noise displacement in the vertex shader for organic micro-detail
- Mood-driven vertex colours (dusty rose → terracotta → warm amber-gold)
- Mood-coloured octahedron markers at each session's peak, hoverable to surface the date, session label, and memory summary
 
Supabase Realtime pushes `UPDATE` events when post-processing completes — the terrain rebuilds with a new vertex in real time at the end of a live call.
 
### Database Schema
 
```
users           — profile, phone, timezone, call_time_pref
calls           — status, mood_score, sentiment_variance, session_label, vapi_call_id
call_turns      — per-utterance transcript, role, turn_index (UNIQUE constraint)
memory_chunks   — content, embedding vector(384), themes[], entities[]
```
 
All tables have Row Level Security enabled. Every policy gates on `auth.uid() = user_id`. The Supabase service role key is used only server-side for webhook writes that have no user session.
 
### Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL, pgvector, Auth, Realtime) |
| Call orchestration | Vapi.ai |
| PSTN | Twilio |
| STT | Deepgram nova-2 |
| TTS | ElevenLabs |
| AI model | Qwen3-8B (RLHF/DPO fine-tuned), vllm |
| Model tunnel | Cloudflare Tunnel |
| Post-call analysis | Groq — Llama 3.1 8B Instant |
| Embeddings | Hugging Face — sentence-transformers/all-MiniLM-L6-v2 |
| 3D visualization | Three.js r128 |
| Deployment | Vercel |

---

<small>Built in 36 hours at GenAI Genesis 2026</small>
