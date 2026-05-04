import { NextResponse } from 'next/server'

const EXPIRED_AT = new Date(0)

export async function POST() {
  const res = NextResponse.json({ ok: true })

  // Host-only cookie variants
  res.cookies.set({
    name: 'payload-token',
    value: '',
    httpOnly: true,
    expires: EXPIRED_AT,
    path: '/',
    sameSite: 'lax',
    secure: false,
  })

  res.cookies.set({
    name: 'payload-token',
    value: '',
    httpOnly: true,
    expires: EXPIRED_AT,
    path: '/',
    sameSite: 'none',
    secure: true,
  })

  // Domain-scoped localhost variants (in case previous cookies were set with domain)
  res.cookies.set({
    name: 'payload-token',
    value: '',
    httpOnly: true,
    domain: 'localhost',
    expires: EXPIRED_AT,
    path: '/',
    sameSite: 'lax',
    secure: false,
  })

  res.cookies.set({
    name: 'payload-token',
    value: '',
    httpOnly: true,
    domain: 'localhost',
    expires: EXPIRED_AT,
    path: '/',
    sameSite: 'none',
    secure: true,
  })

  return res
}
