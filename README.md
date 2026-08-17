# AI Fitness Gym Management Template

Open-source gym membership, QR check-in, payment evidence and PT management template built with Next.js, Supabase and AI-assisted development.

> Community Edition: Demo Gym branding, clean history, and no production credentials or customer records.

## Features

- Manager authentication with Supabase Auth
- Member registration, renewal and expiry status
- QR self check-in
- PT package and session tracking
- Payment evidence upload workflow
- Operational reports
- Mobile-first interface

## Tech stack

Next.js App Router, TypeScript, Supabase Auth/Postgres/Storage, Drizzle ORM and Vercel.

## Quick start

1. Fork or clone this repository.
2. Create your own Supabase project.
3. Copy `.env.example` to `.env.local` and enter your values.
4. Run SQL files in `supabase/migrations` in filename order.
5. Create a manager in Supabase Authentication.
6. Run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`. Public QR check-in is `/checkin`.

## Environment variables

Never commit `.env.local`, passwords, secret keys, production URLs or real member data. Browser code may use only the publishable key. `SUPABASE_SECRET_KEY` and `POSTGRES_URL` are server-only.

## Data flow

```text
Manager/member browser → Next.js UI/API → Supabase Auth + PostgreSQL + Storage
                                      → dashboard/check-in/renewal/reports
```

## ภาษาไทย

โปรเจกต์ตัวอย่างสำหรับบริหารสมาชิกยิม เช็กอินผ่าน QR จัดการ PT การต่ออายุ และหลักฐานการชำระเงิน กรุณาสร้าง Supabase Project ของตนเองและไม่ใช้ข้อมูลลูกค้าจริงใน Public Demo

## Security notice

Educational starter only. Before production, review authentication, authorization, RLS, rate limits, file validation, backups and applicable privacy laws.

## License

MIT © 2026 beeruttr-Beey
