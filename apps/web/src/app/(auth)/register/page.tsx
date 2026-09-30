import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/features/auth/auth-shell";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = { title: "سجّل محلك" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="سجّل محلك"
      subtitle="دقيقة واحدة، وبعدها نجهّز أسعارك وموديلاتك"
      footer={
        <>
          عندك حساب؟{" "}
          <Link href="/login" className="font-bold">
            سجّل دخولك
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
