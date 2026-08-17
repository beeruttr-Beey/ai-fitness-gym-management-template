import { createSupabaseServerClient } from "../../../lib/supabase/server";
export async function POST(request:Request){const supabase=await createSupabaseServerClient();await supabase.auth.signOut();return Response.redirect(new URL("/login",request.url),303)}
