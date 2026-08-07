// LLM gateway: tries Gemini first, falls back to Groq on 429 quota errors.
// All callers use callGemini / callGeminiJSON — no changes needed elsewhere.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Sleep helper. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Gemini call
// ---------------------------------------------------------------------------
async function callGeminiDirect(prompt, opts = {}) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 2048,
    },
  });

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, text: data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '' };
  }

  const errText = await res.text();
  return { ok: false, status: res.status, errText };
}

// ---------------------------------------------------------------------------
// Groq call (OpenAI-compatible)
// ---------------------------------------------------------------------------
async function callGroqDirect(prompt, opts = {}) {
  if (!GROQ_KEY) {
    return { ok: false, status: 401, errText: 'GROQ_API_KEY is not set in backend/.env' };
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 2048,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, text: data?.choices?.[0]?.message?.content || '' };
  }

  const errText = await res.text();
  return { ok: false, status: res.status, errText };
}

// ---------------------------------------------------------------------------
// Ollama call (Local)
// ---------------------------------------------------------------------------
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function callOllamaDirect(prompt, opts = {}) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: opts.temperature ?? 0.2,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, text: data.response || '' };
    }

    const errText = await res.text();
    return { ok: false, status: res.status, errText: `Ollama error: ${errText}` };
  } catch (err) {
    return { ok: false, status: 500, errText: `Cannot connect to Ollama at ${OLLAMA_URL}. Is it running?` };
  }
}

// ---------------------------------------------------------------------------
// Public API — same interface as before
// ---------------------------------------------------------------------------

/**
 * Calls Gemini with automatic Groq -> Ollama fallback on quota errors (429).
 * @param {string} prompt
 * @param {object} opts - { json, temperature, maxTokens }
 */
export async function callGemini(prompt, opts = {}) {
  const fullPrompt = opts.json
    ? `${prompt}\n\nRespond with ONLY valid JSON. No markdown code fences, no preamble, no explanation — just the JSON.`
    : prompt;

  let lastError = null;

  // 1. Try Gemini
  if (GEMINI_KEY) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      const result = await callGeminiDirect(fullPrompt, opts);
      if (result.ok) return result.text;
      
      lastError = `Gemini API error (${result.status}): ${result.errText}`;
      
      // 429 = quota exhausted → fall through to Groq immediately.
      if (result.status === 429) {
        console.warn(`Gemini quota exhausted (429) — falling back to Groq (${GROQ_MODEL})…`);
        break; // break the retry loop, move to next provider
      }

      // Other transient errors (500, 503) — wait briefly then retry once.
      if ((result.status === 500 || result.status === 503) && attempt === 0) {
        console.warn(`Gemini ${result.status} — retrying in 3s…`);
        await sleep(3000);
        continue;
      }
      
      break; // Not a transient or quota error, move to next provider.
    }
  } else {
    lastError = 'GEMINI_API_KEY not set.';
  }

  // 2. Fallback to Groq
  if (GROQ_KEY) {
    console.warn(`Calling Groq...`);
    const result = await callGroqDirect(fullPrompt, opts);
    if (result.ok) return result.text;
    
    lastError = `Groq API error (${result.status}): ${result.errText}`;
    
    // 429 = Groq quota/rate limit exhausted → fall through to Ollama immediately.
    if (result.status === 429) {
      console.warn(`Groq quota exhausted (429) — falling back to local Ollama (${OLLAMA_MODEL})…`);
    } else {
      console.warn(`Groq failed: ${lastError} — falling back to local Ollama…`);
    }
  } else {
    lastError = lastError ? `${lastError} | GROQ_API_KEY not set.` : 'GROQ_API_KEY not set.';
    console.warn(`No GROQ_KEY — falling back directly to Ollama (${OLLAMA_MODEL})…`);
  }

  // 3. Final Fallback: Local Ollama (Zero quotas)
  console.warn(`Calling Ollama...`);
  const result = await callOllamaDirect(fullPrompt, opts);
  if (result.ok) return result.text;

  lastError = `${lastError} | Ollama API error (${result.status}): ${result.errText}`;
  throw new Error(`All LLM providers failed. Last error: ${lastError}`);
}

/** Calls the LLM expecting JSON back; strips code fences defensively and parses. */
export async function callGeminiJSON(prompt, opts = {}) {
  const raw = await callGemini(prompt, { ...opts, json: true });
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse LLM JSON response: ${e.message}\nRaw: ${cleaned.slice(0, 500)}`);
  }
}
