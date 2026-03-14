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

      // ── Placeholder model (swap url + model when your weights are ready) ──
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        systemPrompt: `You are a warm, attentive AI therapist conducting a brief daily check-in call.
Keep responses to 1-2 sentences. Ask only one question at a time.
Use reflective listening — mirror what the user says before responding.
Never give unsolicited advice. Never diagnose.
If the user seems in crisis, say: "It sounds like things are really hard right now. Have you been able to talk to someone you trust, or a professional?"
Context from prior sessions with this user:
{{memory}}`,
        temperature: 0.7,
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
      responseDelaySeconds: 0.5,     // slight pause feels more human

      serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
    }),
  })

  const data = await res.json()
  console.log('Full response:', JSON.stringify(data, null, 2))
  console.log('VAPI_ASSISTANT_ID=' + data.id)
  }

main()