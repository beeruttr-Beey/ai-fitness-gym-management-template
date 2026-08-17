import { login } from "./actions";

export default async function LoginPage({ searchParams }:{ searchParams:Promise<{error?:string}> }) {
  const { error } = await searchParams;
  return <main className="login-shell"><section className="login-card"><div className="login-logo">F</div><span className="eyebrow">DEMO GYM MANAGER</span><h1>เข้าสู่ระบบ</h1><p>สำหรับผู้จัดการยิมและผู้ดูแลระบบ</p><form action={login}><label>อีเมล<input name="email" type="email" required autoComplete="email"/></label><label>รหัสผ่าน<input name="password" type="password" required autoComplete="current-password"/></label>{error&&<div className="login-error">{error}</div>}<button>เข้าสู่ระบบ</button></form><small>บัญชีผู้ใช้งานสร้างโดยผู้ดูแลใน Supabase</small></section></main>;
}
