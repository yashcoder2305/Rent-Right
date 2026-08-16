// LLM gateway using official @google/generative-ai SDK with automatic model fallbacks.
import { GoogleGenerativeAI } from '@google/generative-ai';

// Only stable, active, high-quota models supported by this API key
const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGeminiDirect(prompt, opts = {}) {
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey || !rawKey.trim()) {
    return { ok: false, status: 401, errText: 'GEMINI_API_KEY is not set in environment variables.' };
  }

  const apiKey = rawKey.trim();
  const genAI = new GoogleGenerativeAI(apiKey);

  const models = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL.trim(), ...DEFAULT_MODELS]
    : DEFAULT_MODELS;

  let lastErr = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          maxOutputTokens: opts.maxTokens ?? 2048,
        },
      });

      const response = await result.response;
      const text = response.text();
      if (text) {
        return { ok: true, text };
      }
    } catch (err) {
      lastErr = err.message || String(err);
      console.warn(`Gemini SDK call to '${modelName}' failed: ${lastErr} — trying next model…`);
      continue;
    }
  }

  return { ok: false, status: 500, errText: lastErr || 'Failed to generate response from Gemini API.' };
}

async function callGroqDirect(prompt, opts = {}) {
  const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;
  if (!groqKey) {
    return { ok: false, status: 401, errText: 'GROQ_API_KEY not set.' };
  }

  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

  const res = await fetch(groqUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
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

async function callOllamaDirect(prompt, opts = {}) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: { temperature: opts.temperature ?? 0.2 },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, text: data.response || '' };
    }

    const errText = await res.text();
    return { ok: false, status: res.status, errText: `Ollama error: ${errText}` };
  } catch (err) {
    return { ok: false, status: 500, errText: `Cannot connect to Ollama at ${ollamaUrl}.` };
  }
}

export async function callGemini(prompt, opts = {}) {
  const fullPrompt = opts.json
    ? `${prompt}\n\nRespond with ONLY valid JSON. No markdown code fences, no preamble, no explanation — just the JSON.`
    : prompt;

  let lastError = null;

  // 1. Try Gemini via official SDK
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim()) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      const result = await callGeminiDirect(fullPrompt, opts);
      if (result.ok) return result.text;

      lastError = `Gemini API: ${result.errText}`;

      if (attempt === 0) {
        await sleep(1500);
        continue;
      }
      break;
    }
  } else {
    lastError = 'GEMINI_API_KEY is not configured in Vercel Environment Variables.';
  }

  // 2. Try Groq if configured
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    const result = await callGroqDirect(fullPrompt, opts);
    if (result.ok) return result.text;
    lastError = `Groq API (${result.status}): ${result.errText}`;
  }

  // 3. Try Ollama if running locally
  if (process.env.OLLAMA_URL) {
    const result = await callOllamaDirect(fullPrompt, opts);
    if (result.ok) return result.text;
    lastError = `Ollama API (${result.status}): ${result.errText}`;
  }

  throw new Error(`LLM Analysis failed: ${lastError}`);
}

export async function callGeminiJSON(prompt, opts = {}) {
  const raw = await callGemini(prompt, { ...opts, json: true });
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse LLM JSON response: ${e.message}\nRaw: ${cleaned.slice(0, 500)}`);
  }
}
