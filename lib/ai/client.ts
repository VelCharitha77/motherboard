// Server-side only Gemini API Client Wrapper
// Reads GEMINI_API_KEY from environment. Never exposed to browser.

export interface GeminiCallOptions {
  model?: 'fast' | 'strong';
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export const AI_CONFIG = {
  fastModel: 'gemini-1.5-flash',
  strongModel: 'gemini-1.5-pro',
  rateLimitPerHour: 30,
};

export async function callGemini(
  prompt: string,
  options?: GeminiCallOptions
): Promise<{ text: string | null; tokenCount: number; latencyMs: number; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: null,
      tokenCount: 0,
      latencyMs: 0,
      error: 'AI assistant unavailable right now (GEMINI_API_KEY not configured)',
    };
  }

  const modelName = options?.model === 'strong' ? AI_CONFIG.strongModel : AI_CONFIG.fastModel;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const startTime = Date.now();

  try {
    const payload: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 1024,
      },
    };

    if (options?.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return {
        text: null,
        tokenCount: 0,
        latencyMs,
        error: `Gemini API returned error ${response.status}: ${errText.substring(0, 150)}`,
      };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text ?? null;
    const tokenCount = data.usageMetadata?.totalTokenCount ?? Math.ceil(prompt.length / 4);

    return {
      text,
      tokenCount,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      text: null,
      tokenCount: 0,
      latencyMs,
      error: err instanceof Error ? err.message : 'Unknown Gemini API connection failure',
    };
  }
}
