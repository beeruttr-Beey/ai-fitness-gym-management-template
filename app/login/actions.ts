"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent("อีเมลหรือรหัสผ่านไม่ถูกต้อง")}`);
  redirect("/");
}
