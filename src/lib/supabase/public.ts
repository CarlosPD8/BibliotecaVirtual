import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Cookie-less client for public reads. Keeping cookies out of the home page
 * lets Next render it statically and refresh it with revalidatePath.
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
