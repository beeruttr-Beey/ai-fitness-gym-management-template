import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { bodyAssessments, checkIns, followUps, memberships, payments, ptPackages, ptSessions, renewalRequests } from "../../../db/schema";
import { getManagerUser } from "../../auth";

async function user(request: Request) {
  return getManagerUser();
}
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const u=await user(request); if(!u)return Response.json({error:"กรุณาเข้าสู่ระบบ"},{status:401});
  try { const db=getDb();
  const packages=await db.select().from(ptPackages).orderBy(desc(ptPackages.id));
  const sessions=await db.select().from(ptSessions).orderBy(desc(ptSessions.id));
  const assessments=await db.select().from(bodyAssessments).orderBy(desc(bodyAssessments.id));
  const visits=await db.select().from(checkIns).orderBy(desc(checkIns.id)).limit(100);
  const followups=await db.select().from(followUps).orderBy(desc(followUps.id)).limit(100);
  const paymentRows=await db.select().from(payments).orderBy(desc(payments.id)).limit(100);
  const membershipRows=await db.select().from(memberships).orderBy(desc(memberships.id)).limit(100);
  const renewals=await db.select().from(renewalRequests).orderBy(desc(renewalRequests.id)).limit(100);
  return Response.json({packages,sessions,assessments,visits,followups,payments:paymentRows,memberships:membershipRows,renewals});
  } catch (error) { if(new URL(request.url).hostname==="terminal.local")return Response.json({packages:[],sessions:[],assessments:[],visits:[],followups:[],payments:[],memberships:[],renewals:[]}); return Response.json({error:error instanceof Error?error.message:"โหลดข้อมูลไม่สำเร็จ"},{status:500}); }
}

export async function POST(request: Request) {
  const u=await user(request); if(!u)return Response.json({error:"กรุณาเข้าสู่ระบบ"},{status:401});
  const b=await request.json() as Record<string,any>; const db=getDb(); const memberId=Number(b.memberId);
  if(!Number.isInteger(memberId))return Response.json({error:"กรุณาเลือกสมาชิก"},{status:400});
  if(b.action==="checkin") { const today=new Date().toISOString().slice(0,10); const [active]=await db.select().from(memberships).where(and(eq(memberships.memberId,memberId),sql`${memberships.startsAt} <= ${today}`,sql`${memberships.expiresAt} >= ${today}`)).orderBy(desc(memberships.id)).limit(1); if(!active){const [pending]=await db.select().from(renewalRequests).where(and(eq(renewalRequests.memberId,memberId),eq(renewalRequests.status,"pending"))).limit(1);if(!pending)await db.insert(renewalRequests).values({memberId});return Response.json({error:"Membership หมดอายุ ระบบเพิ่มรายการรอต่ออายุแล้ว"},{status:400});} await db.insert(checkIns).values({memberId,recordedBy:u.email,source:"manager",reason:b.reason||"manager assistance"}); }
  else if(b.action==="buyPt") { const paidAt=b.date||new Date().toISOString().slice(0,10); const [p]=await db.insert(payments).values({memberId,amount:5000,paidAt,paymentMethod:b.paymentMethod||"cash",recordedBy:u.email}).returning(); await db.insert(ptPackages).values({memberId,paymentId:p.id,purchasedAt:paidAt}); }
  else if(b.action==="usePt") { const [pkg]=await db.select().from(ptPackages).where(and(eq(ptPackages.memberId,memberId),gt(ptPackages.remainingSessions,0))).orderBy(desc(ptPackages.id)).limit(1); if(!pkg)return Response.json({error:"ไม่มี PT Session คงเหลือ"},{status:400}); await db.insert(ptSessions).values({memberId,packageId:pkg.id,trainedAt:b.date||new Date().toISOString().slice(0,10),program:b.program||null,effort:b.effort?Number(b.effort):null,painNote:b.painNote||null,recordedBy:u.email}); await db.update(ptPackages).set({remainingSessions:sql`${ptPackages.remainingSessions}-1`}).where(eq(ptPackages.id,pkg.id)); }
  else if(b.action==="progress") { if(!b.consent)return Response.json({error:"ต้องได้รับความยินยอมก่อนบันทึกข้อมูลสุขภาพ"},{status:400}); const n=(x:any)=>x?Number(x):null; await db.insert(bodyAssessments).values({memberId,assessedAt:b.date||new Date().toISOString().slice(0,10),weight:n(b.weight),waist:n(b.waist),hip:n(b.hip),arm:n(b.arm),thigh:n(b.thigh),bodyFat:n(b.bodyFat),muscleMass:n(b.muscleMass),goal:b.goal||null,note:b.note||null,consent:true,recordedBy:u.email}); }
  else if(b.action==="followup") await db.insert(followUps).values({memberId,type:b.type||"renewal",note:b.note||null,recordedBy:u.email});
  else return Response.json({error:"Action ไม่ถูกต้อง"},{status:400});
  return Response.json({ok:true});
}
