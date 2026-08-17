import { getManagerUser } from "../../auth";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

async function authorizedUser(request: Request) {
  return getManagerUser();
}

export async function POST(request: Request) {
  const user = await authorizedUser(request);
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "กรุณาเลือกไฟล์หลักฐาน" }, { status: 400 });
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(file.type)) return Response.json({ error: "รองรับเฉพาะ JPG, PNG หรือ PDF" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "ไฟล์หลักฐานต้องไม่เกิน 5 MB" }, { status: 400 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "slip";
  const key = `${new Date().toISOString().slice(0,10)}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from("payment-evidence").upload(key, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) return Response.json({ error: `อัปโหลดหลักฐานไม่สำเร็จ: ${error.message}` }, { status: 500 });
  return Response.json({ key, name: file.name, contentType: file.type }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await authorizedUser(request);
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key.includes("..")) return Response.json({ error: "ไฟล์ไม่ถูกต้อง" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from("payment-evidence").createSignedUrl(key, 60);
  if (error || !data) return Response.json({ error: "ไม่พบหลักฐาน" }, { status: 404 });
  return Response.redirect(data.signedUrl, 302);
}
