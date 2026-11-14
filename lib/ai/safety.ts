// Shared AI Safety & Allow-List Layer
// STRICTLY ENFORCED: Never send income, household, funding, eligibility, or payment data to Gemini

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export const AI_DISCLAIMER_LABEL = 'Generated with AI — review before using';

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; error?: string } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  let bucket = rateLimitBuckets.get(userId);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateLimitBuckets.set(userId, bucket);
  }

  if (bucket.count >= 30) {
    return {
      allowed: false,
      remaining: 0,
      error: 'You have reached the demo rate limit of 30 AI requests per hour. Please wait a bit before requesting again.',
    };
  }

  bucket.count++;
  return { allowed: true, remaining: 30 - bucket.count };
}

/**
 * Validates that an object contains ONLY allow-listed safe fields,
 * completely preventing financial, household, income, or payment data leaks.
 */
export function sanitizeAllowList<T extends Record<string, unknown>>(
  input: T,
  allowedKeys: (keyof T)[]
): Partial<T> {
  const safeObj: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in input) {
      const val = input[key];
      // Defensive string scanning for sensitive keywords
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (
          lower.includes('ssn') ||
          lower.includes('tax return') ||
          lower.includes('w-2') ||
          lower.includes('household income') ||
          lower.includes('annual income')
        ) {
          continue; // Redact suspicious inputs
        }
      }
      safeObj[key] = val;
    }
  }
  return safeObj;
}
