import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/features/auth/auth-shell";
import { buttonStyles } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/info-note";

export const metadata: Metadata = { title: "نسيت كلمة السر" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="نسيت كلمة السر؟" subtitle="مفيش مشكلة، هنرجّعلك حسابك">
      <InfoNote>
        لو إنت فني، كلّم صاحب المحل يعملك كلمة سر جديدة. ولو إنت صاحب المحل، كلّم دعم سِجاف على واتساب وهيساعدوك.
      </InfoNote>
      <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg" })}>
        رجوع لتسجيل الدخول
      </Link>
    </AuthShell>
  );
}
