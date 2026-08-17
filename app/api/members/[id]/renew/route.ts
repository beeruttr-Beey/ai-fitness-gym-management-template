import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { members, memberships, payments, renewalRequests } from "../../../../../db/schema";
import { getManagerUser } from "../../../../auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getManagerUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { id } = await context.params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) return Response.json({ error: "Member ID ไม่ถูกต้อง" }, { status: 400 });
  const body = await request.json() as { paidAt?: string; paymentMethod?: string; slipKey?: string; slipName?: string; slipContentType?: string };
  if (!body.slipKey) return Response.json({ error: body.paymentMethod === "cash" ? "กรุณาถ่ายรูปหลักฐานรับเงินสด" : "กรุณาแนบสลิปการโอนเงิน" }, { status: 400 });
  const paidAt = body.paidAt || new Date().toISOString().slice(0, 10);
  const expires = new Date(`${paidAt}T00:00:00Z`); expires.setUTCDate(expires.getUTCDate() + 29);
  const db = getDb();
  const exists = await db.select({ id: members.id }).from(members).where(eq(members.id, memberId)).limit(1);
  if (!exists[0]) return Response.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
  const [payment] = await db.insert(payments).values({ memberId, amount: 890, paidAt, paymentMethod: body.paymentMethod || "cash", slipKey: body.slipKey || null, slipName: body.slipName || null, slipContentType: body.slipContentType || null, recordedBy: user.email }).returning();
  await db.insert(memberships).values({ memberId, paymentId: payment.id, startsAt: paidAt, expiresAt: expires.toISOString().slice(0, 10) });
  await db.update(renewalRequests).set({status:"resolved",resolvedAt:new Date().toISOString()}).where(eq(renewalRequests.memberId,memberId));
  return Response.json({ ok: true });
}
