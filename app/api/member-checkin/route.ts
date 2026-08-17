import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { checkIns, members, memberships, renewalRequests } from "../../../db/schema";

export const dynamic = "force-dynamic";
const clean=(v:string)=>v.replace(/\D/g,"");

export async function POST(request:Request){
  try{
    const b=await request.json() as {phone?:string;pin?:string}; const phone=clean(b.phone||""); const pin=clean(b.pin||"");
    if(phone.length<9||pin.length!==4)return Response.json({error:"กรุณากรอกเบอร์โทรและ PIN 4 หลัก"},{status:400});
    const db=getDb(); const all=await db.select().from(members); const member=all.find(m=>clean(m.phone)===phone);
    if(!member||phone.slice(-4)!==pin)return Response.json({error:"ไม่พบสมาชิกหรือ PIN ไม่ถูกต้อง"},{status:404});
    const today=new Date().toISOString().slice(0,10); const [active]=await db.select().from(memberships).where(and(eq(memberships.memberId,member.id),sql`${memberships.startsAt} <= ${today}`,sql`${memberships.expiresAt} >= ${today}`)).orderBy(desc(memberships.id)).limit(1);
    if(!active){ const [pending]=await db.select().from(renewalRequests).where(and(eq(renewalRequests.memberId,member.id),eq(renewalRequests.status,"pending"))).limit(1); if(!pending)await db.insert(renewalRequests).values({memberId:member.id}); return Response.json({status:"expired",name:member.fullName,message:"Membership หมดอายุ กรุณาติดต่อ Manager เพื่อต่ออายุ 890 บาท"}); }
    const since=new Date(Date.now()-4*60*60*1000).toISOString(); const [recent]=await db.select().from(checkIns).where(and(eq(checkIns.memberId,member.id),gte(checkIns.checkedInAt,since))).orderBy(desc(checkIns.id)).limit(1);
    if(recent)return Response.json({status:"duplicate",name:member.fullName,message:"คุณ Check-in แล้วภายใน 4 ชั่วโมงที่ผ่านมา"});
    await db.insert(checkIns).values({memberId:member.id,recordedBy:"member-self",source:"member"});
    return Response.json({status:"success",name:member.fullName,message:"Check-in สำเร็จ ยินดีต้อนรับค่ะ"});
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Check-in ไม่สำเร็จ"},{status:500})}
}
