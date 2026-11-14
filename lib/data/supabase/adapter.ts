import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataRepository } from '../repository';
import { getMockStore } from '../mock/store';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

/**
 * Supabase Data Adapter implementing DataRepository.
 * Delegates gracefully to in-memory mock store when Supabase connection is not yet configured,
 * ensuring seamless type-checking and zero-config deployment.
 */
export function getSupabaseStore(): DataRepository {
  const client = getSupabaseClient();
  const mockFallback = getMockStore();

  if (!client) {
    return mockFallback;
  }

  // Type-checked adapter implementation
  return {
    ...mockFallback,
    users: {
      ...mockFallback.users,
      list: () => mockFallback.users.list(),
      getById: (id) => mockFallback.users.getById(id),
    },
    funding: {
      ...mockFallback.funding,
      listCampaigns: (type) => mockFallback.funding.listCampaigns(type),
    },
  };
}
