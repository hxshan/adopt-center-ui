const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const ENHANCE_SYSTEM_PROMPT = `You are a pet adoption listing writer.
Polish the staff's raw notes into a short, friendly, and natural-sounding description.
Keep it simple, concise, and easy to read — 2 to 3 sentences max, under 60 words.
Do not exaggerate. Keep all facts accurate.
Return ONLY the description — no preamble, no quotes, no explanation.`;

/**
 * Enhances a pet description using OpenRouter (gpt-4o-mini).
 * Returns the enhanced text, or the original text on failure.
 */
export async function enhanceDescription(rawText) {
  if (!OPENROUTER_KEY || !rawText || !rawText.trim()) return rawText;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'petconnect-adoption-center',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: rawText.trim() },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter error:', response.status);
      return rawText;
    }

    const data = await response.json();
    const enhanced = data?.choices?.[0]?.message?.content?.trim();
    return enhanced || rawText;
  } catch (err) {
    console.error('Failed to enhance description:', err);
    return rawText;
  }
}
