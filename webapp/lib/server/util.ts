import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauth() {
  return bad("Not signed in.", 401);
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function newPairingCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
