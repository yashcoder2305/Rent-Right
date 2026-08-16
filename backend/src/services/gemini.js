// LLM gateway: tries Gemini first with multi-endpoint fallback, falls back to Groq / Ollama if configured.

const DEFAULT_GEMINI_ENDPOINTS = [
  { model: 'gemini-1.5-flash-latest', version: 'v1beta' },
  { model: 'gemini-1.5-flash', version: 'v1' },
  { model: 'gemini-2.0-flash-exp', version: 'v1beta' },
  { model: 'gemini-1.5-pro-latest', version: 'v1beta' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGeminiDirect(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 401, errText: 'GEMINI_API_KEY is not configured in environment variables.' };
  }

  const endpoints = process.env.GEMINI_MODEL
    ? [{ model: process.env.GEMINI_MODEL, version: 'v1beta' }, ...DEFAULT_GEMINI_ENDPOINTS]
    : DEFAULT_GEMINI_ENDPOINTS;

  let lastResult = null;
  for (const { model, version } of endpoints) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.2,
        maxOutputTokens: opts.maxTokens ?? 2048,
      },
    });

    try {
      const res = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, text: data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '' };
      }

      const errText = await res.text();
      lastResult = { ok: false, status: res.status, errText };

      if (res.status === 404 && endpoints.length > 1) {
        console.warn(`Gemini model '${model}' on ${version} returned 404 — trying next endpoint…`);
        continue;
      }
      break;
    } catch (fetchErr) {
      lastResult = { ok: false, status: 500, errText: fetchErr.message };
    }
  }

  return lastResult || { ok: false, status: 500, errText: 'No Gemini model available' };
}

async function callGroqDirect(prompt, opts = {}) {
  const groqKey = process.env.GROQ_API_KEY;
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

  // 1. Try Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      const result = await callGeminiDirect(fullPrompt, opts);
      if (result.ok) return result.text;

      lastError = `Gemini API (${result.status}): ${result.errText}`;

      if (result.status === 429) {
        console.warn('Gemini quota exhausted (429) — trying backup provider…');
        break;
      }
      if ((result.status === 500 || result.status === 503) && attempt === 0) {
        await sleep(2000);
        continue;
      }
      break;
    }
  } else {
    lastError = 'GEMINI_API_KEY is not set in environment variables.';
  }

  // 2. Try Groq if configured
  if (process.env.GROQ_API_KEY) {
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
