# TherapistRL

> *An AI therapist that calls you daily, remembers everything, and gets to know you over time.*

TherapistRL is a voice-first AI therapy system that conducts daily check-in calls via your real phone number. After each call, it analyzes the transcript, extracts what mattered, embeds it into a persistent memory store, and walks into the next call already knowing your context. Your emotional history is rendered as a navigable 3D terrain — peaks are good days, valleys are hard ones, and the texture reflects how stable or volatile each session was.

---

## What makes this different

Most AI therapy products are chat interfaces. TherapistRL makes real outbound phone calls to your mobile number using a custom RLHF fine-tuned therapy model. The AI remembers who you've mentioned, what stresses you out, and how your mood has trended — not because you filled out a profile, but because it has been listening across every session and building a semantic memory of your emotional landscape.

---

## The model

The conversational AI is a Qwen3-8B model fine-tuned using RLHF on curated therapy dialogue datasets. The fine-tuning process aligned the model toward core therapeutic techniques: reflective listening, Socratic questioning, cognitive reframing, and somatic grounding. Chain-of-thought reasoning is disabled at the server level for low-latency real-time voice response.

The model is self-hosted, served via vllm with an OpenAI-compatible `/v1/chat/completions` endpoint, and exposed over HTTPS via Cloudflare Tunnel.

---

## System architecture

```
User clicks "Start check-in call"
  → /api/calls/initiate
      → fetch top 5 memory chunks from pgvector (cosine similarity)
      → create calls row in Supabase
      → POST to Vapi API with phone number + memory context

Vapi orchestrates the call
  → Twilio dials the user's real phone number (PSTN)
  → Deepgram transcribes speech in real time (nova-2)
  → Qwen3-8B generates therapeutic responses
  → ElevenLabs synthesizes speech and plays it through the phone

Vapi fires webhook events → /api/vapi/webhook
  → status-update:        set started_at, picked_up = true
  → conversation-update:  upsert turns to call_turns
  → end-of-call-report:   mark completed, trigger post-processing
  → call-failed:          mark missed or failed

/api/calls/process (async, after call ends)
  → Groq (Llama 3.1 8B) analyzes transcript
      → mood_score, sentiment_variance, primary_technique,
         session_label, themes[], entities[], memory_summary
  → update calls row with analysis results
  → embed memory_summary via Transformers.js (local, no API)
  → store embedding + metadata in memory_chunks (pgvector)
```

---

## Memory and RAG

Between calls, a RAG layer builds a persistent semantic memory of the user. After each call:

1. Groq extracts a 1-2 sentence memory summary, recurring themes, and named entities from the transcript
2. The summary is embedded using `all-MiniLM-L6-v2` running locally via Transformers.js — no external API, no cost, 384-dimensional vectors
3. The embedding is stored in Supabase's pgvector column alongside themes and entities

Before the next call, the initiate route queries:
```sql
SELECT content FROM memory_chunks
WHERE user_id = $1
ORDER BY embedding <=> $2  -- cosine distance
LIMIT 5
```

The top 5 most relevant chunks are injected into the system prompt. The AI walks into every call already knowing what the user has been carrying.

---

## The emotional terrain

The dashboard is a Three.js 3D heightmap built from the user's call history.

**Axes:**
- **X** — time (each call is a column of vertices)
- **Y** — mood score (ridge height)
- **Z** — emotional volatility (Gaussian ridge profile scaled by `sentiment_variance`)

**Vertex colors:**
- Warm amber/gold — stable, high-mood sessions
- Deep indigo/blue — low mood
- Near-white/grey — high volatility
- Muted teal — neutral mid-range

**Technique markers:** floating octahedra above each call's peak, color-coded by therapeutic technique. Hover to inspect session details via raycasting.

**Reward ribbon:** a `TubeGeometry` following a `CatmullRomCurve3` plotting the reward signal (mood + stability) over time behind the terrain. The tube narrows as scores improve.

**Live updates:** Supabase Realtime pushes `UPDATE` events on the `calls` table. When post-processing completes, the terrain rebuilds with the new session's vertex in real time.

---

## Database schema

```
users
  id (uuid, FK → auth.users)
  fname, lname, email, bio
  phone (E.164 format)
  timezone, call_time_pref
  created_at, updated_at

calls
  id, user_id
  status (scheduled | in_progress | completed | missed | failed)
  scheduled_at, started_at, ended_at
  duration_seconds (generated: ended_at - started_at)
  vapi_call_id
  mood_score, sentiment_variance
  primary_technique, session_label
  picked_up

call_turns
  id, call_id, user_id
  role (user | assistant)
  content, turn_index
  spoken_at
  UNIQUE (call_id, turn_index)

memory_chunks
  id, user_id, call_id
  content
  embedding (vector(384))
  themes[], entities[]
  created_at
  INDEX: hnsw (embedding vector_cosine_ops)
```

Row-level security is enabled on all tables. All policies use `auth.uid() = user_id`. The Supabase service role key is used only server-side in API routes for webhook writes that cannot be user-authenticated.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL, pgvector, Auth, Realtime) |
| Call orchestration | Vapi.ai |
| PSTN | Twilio |
| Speech-to-text | Deepgram nova-2 |
| Text-to-speech | ElevenLabs |
| AI model | Qwen3-8B (RLHF fine-tuned), served via vllm |
| Model tunnel | Cloudflare Tunnel |
| Post-call analysis | Groq (Llama 3.1 8B Instant) |
| Embeddings | Transformers.js — `all-MiniLM-L6-v2`, fully local |
| 3D visualization | Three.js r128 |

---

## Running locally

### Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vapi
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=
VAPI_ASSISTANT_ID=

# ElevenLabs
ELEVENLABS_VOICE_ID=

# Groq
GROQ_API_KEY=

# Model endpoint
MODEL_ENDPOINT=https://your-cloudflare-tunnel.trycloudflare.com/v1

# Internal route guard
INTERNAL_SECRET=

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Start dev environment

```bash
# Terminal 1 — Next.js
npm install && npm run dev

# Terminal 2 — ngrok (webhook tunnel)
npx ngrok http --domain=your-static-domain.ngrok-free.app 3000

# Terminal 3 — model server (on model machine)
python -m vllm.entrypoints.openai.api_server \
  --model ./your-finetuned-weights \
  --served-model-name psycho \
  --host 0.0.0.0 --port 8000

# Terminal 4 — Cloudflare tunnel (on model machine)
cloudflared tunnel --url http://localhost:8000
```

### Update Vapi webhook URL after ngrok restart

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serverUrl": "https://your-ngrok-domain.ngrok-free.app/api/vapi/webhook"}'
```

---

## Roadmap

- Scheduled daily calls via Vercel cron at each user's preferred call time
- Identity web — D3 force-directed graph of entities and themes across sessions
- Weekly email summary of mood trends and recurring topics via Resend
- Crisis detection — post-call flagging and automatic resource outreach
