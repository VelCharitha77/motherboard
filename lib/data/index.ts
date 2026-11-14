import { DataRepository } from './repository';
import { getMockStore } from './mock/store';

export function getRepository(): DataRepository {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE || process.env.DATA_MODE || 'mock';
  if (mode === 'supabase') {
    // Lazy-load Supabase adapter if configured
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabaseStore } = require('./supabase/adapter');
      return getSupabaseStore();
    } catch {
      // Fallback to mock adapter if Supabase adapter is not yet connected
      return getMockStore();
    }
  }
  return getMockStore();
}

export const db: DataRepository = getRepository();
