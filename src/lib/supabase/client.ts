import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://ggxskngkthftewadjdkz.supabase.co'

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_pbGxWp8jmYaEDJaOKv0VOw__mBQ3wab'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}