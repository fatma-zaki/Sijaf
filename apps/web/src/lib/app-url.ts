import "server-only";
import { headers } from "next/headers";

/**
 * أصل الموقع للينكات اللي بتطلع برا (واتساب وOpen Graph):
 * NEXT_PUBLIC_APP_URL لو متظبط، وإلا من الطلب نفسه.
 */
export async function appOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function absoluteUrl(path: string): Promise<string> {
  return `${await appOrigin()}${path}`;
}
