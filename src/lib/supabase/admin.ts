// Server-only Supabase with service role key (DO NOT import in client components)
import "server-only";
import { createClient } from "@supabase/supabase-js";

export const createAdminSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRole, {
    auth: { persistSession: false }
  });
};
