import crypto from "crypto";
import { NextRequest } from "next/server";

const SECRET = process.env.AUTH_SECRET || "mifinanzas-change-this-secret";

export function createToken(userId: number): string {
  const payload = JSON.stringify({
    uid: userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export function getAuthUserId(request: NextRequest): number | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}
