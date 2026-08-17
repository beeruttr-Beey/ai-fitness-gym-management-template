import { createSupabaseServerClient } from "../lib/supabase/server";

export type ManagerUser = { email: string; displayName: string };
export async function getManagerUser(): Promise<ManagerUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { email: user.email, displayName: user.user_metadata?.full_name || user.email };
}
