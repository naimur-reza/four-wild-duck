import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
  });
}
