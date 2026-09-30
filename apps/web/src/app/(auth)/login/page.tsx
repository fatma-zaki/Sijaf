import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/features/auth/auth-shell";
import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="أهلاً بيك"
      subtitle="سجّل دخولك عشان تكمّل شغل محلك"
      footer={
        <>
          محل جديد؟{" "}
          <Link href="/register" className="font-bold">
            سجّل محلك مجانًا
          </Link>
        </>
      }
    >
      <LoginForm next={typeof next === "string" ? next : null} />
    </AuthShell>
  );
}
