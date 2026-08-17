import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { members, memberships, payments } from "../../../db/schema";
import { getManagerUser } from "../../auth";

export const dynamic = "force-dynamic";

async function authorizedUser(request: Request) {
  return getManagerUser();
}

export async function GET(request: Request) {
  const user = await authorizedUser(request);
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  try {
    const db = getDb();
    const rows = await db.select({ id: members.id, memberCode: members.memberCode, fullName: members.fullName, phone: members.phone, lineId: members.lineId, startsAt: memberships.startsAt, expiresAt: memberships.expiresAt })
      .from(members).leftJoin(memberships, eq(members.id, memberships.memberId))
      .where(sql`${memberships.id} IS NULL OR ${memberships.id} = (SELECT MAX(m2.id) FROM memberships m2 WHERE m2.member_id = ${members.id})`)
      .orderBy(desc(members.id));
    return Response.json({ members: rows, manager: user.displayName });
  } catch (error) {
    if (new URL(request.url).hostname === "terminal.local") {
      return Response.json({ members: [], manager: "Preview Manager" });
    }
    return Response.json({ error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authorizedUser(request);
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  try {
    const body = await request.json() as { fullName?: string; phone?: string; lineId?: string; paidAt?: string; paymentMethod?: string; slipKey?: string; slipName?: string; slipContentType?: string };
    const fullName = body.fullName?.trim();
    const phone = body.phone?.trim();
    const paidAt = body.paidAt || new Date().toISOString().slice(0, 10);
    if (!fullName || !phone) return Response.json({ error: "กรุณากรอกชื่อและเบอร์โทร" }, { status: 400 });
    if (!body.slipKey) return Response.json({ error: body.paymentMethod === "cash" ? "กรุณาถ่ายรูปหลักฐานรับเงินสด" : "กรุณาแนบสลิปการโอนเงิน" }, { status: 400 });
    const db = getDb();
    const last = await db.select({ id: members.id }).from(members).orderBy(desc(members.id)).limit(1);
    const memberCode = `FM-${String((last[0]?.id ?? 0) + 1).padStart(4, "0")}`;
    const expires = new Date(`${paidAt}T00:00:00Z`); expires.setUTCDate(expires.getUTCDate() + 29);
    const [member] = await db.insert(members).values({ memberCode, fullName, phone, lineId: body.lineId?.trim() || null }).returning();
    const [payment] = await db.insert(payments).values({ memberId: member.id, amount: 890, paidAt, paymentMethod: body.paymentMethod || "cash", slipKey: body.slipKey || null, slipName: body.slipName || null, slipContentType: body.slipContentType || null, recordedBy: user.email }).returning();
    await db.insert(memberships).values({ memberId: member.id, paymentId: payment.id, startsAt: paidAt, expiresAt: expires.toISOString().slice(0, 10) });
    return Response.json({ ok: true, memberCode }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
