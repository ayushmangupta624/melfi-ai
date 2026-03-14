import 'dotenv/config'

async function main() {
  const res = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'TherapistRL',

      // ── Placeholder model (claude, if custom model doesn't work) ──
//       model: {
//         provider: 'anthropic',
//         model: 'claude-sonnet-4-20250514',
//         systemPrompt: `You are a warm, attentive AI therapist conducting a brief daily check-in call.
// Keep responses to 1-2 sentences. Ask only one question at a time.
// Use reflective listening — mirror what the user says before responding.
// Never give unsolicited advice. Never diagnose.
// If the user seems in crisis, say: "It sounds like things are really hard right now. Have you been able to talk to someone you trust, or a professional?"
// Context from prior sessions with this user:
// {{memory}}`,
//         temperature: 0.7,
//       },

model: {
    provider: 'custom-llm',
    url: process.env.MODEL_ENDPOINT,
    apiKey: process.env.MODEL_API_KEY,
    model: 'psycho', 
    temperature: 0.7,
    systemPrompt: `You are a warm, emotionally attuned AI therapist conducting a brief daily check-in call. This call is 2-5 minutes long.

    TONE: Calm, unhurried, genuinely curious. Never clinical. Never cheerful in a forced way. Match the user's energy.
    
    STRUCTURE:
    - Open by acknowledging anything from prior sessions if relevant, then ask how they're doing today.
    - Listen deeply. Reflect back the emotional content, not just the words.
    - Ask one question at a time. Let silence breathe — don't rush to fill it.
    - Gently explore one thread rather than covering many topics.
    - Close warmly. Don't end abruptly.
    
    RULES:
    - Never give advice unless explicitly asked.
    - Never diagnose or label what the user is experiencing.
    - Never say "I understand" — show understanding through reflection instead.
    - Keep most responses to 2-3 sentences. Occasionally shorter is more powerful.
    - If the user seems in crisis: "It sounds like things are really hard right now. Have you been able to reach out to someone you trust, or a professional who can support you?"
    
    MEMORY — what you know about this person from prior sessions:
    {{memory}}
    
    Use this context naturally. Don't recite it back. Let it inform how you listen.`,  
  },
  

      voice: {
        provider: '11labs',
        voiceId: process.env.ELEVENLABS_VOICE_ID,
        stability: 0.5,
        similarityBoost: 0.75,
        // optimize_streaming_latency: 3,
      },

      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',    
        language: 'en',
      },

      firstMessage: "Hey, it's your daily check-in. How are you feeling today?",
      endCallMessage: "Thank you for sharing. I'll talk to you tomorrow. Take care.",
      endCallPhrases: ['goodbye', 'gotta go', 'talk tomorrow', 'bye', 'i have to go'],

      maxDurationSeconds: 360,
      silenceTimeoutSeconds: 30,
      responseDelaySeconds: 0.2,     // slight pause feels more human

      serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
    }),
  })

  const data = await res.json()
  console.log('Full response:', JSON.stringify(data, null, 2))
  console.log('VAPI_ASSISTANT_ID=' + data.id)
  }

main()