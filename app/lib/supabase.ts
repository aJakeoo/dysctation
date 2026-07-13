import { createClient } from "@supabase/supabase-js";

// Fall back to a placeholder so the client can be constructed (and the app
// can build) before real Supabase credentials are configured in
// `.env.local`. Calls made with the placeholder will fail at request time,
// caught by the /contribute page's own error handling.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, anonKey);
