"use client";

import { CopyPlus, Copy, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, buttonStyles, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { duplicateQuote, markQuoteSent } from "./actions";
import { whatsAppUrl } from "./share";

type Look = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string; label?: string };

/**
 * واتساب بيفتح من موبايل المستخدم برسالة جاهزة فيها الرابط؛
 * ومع الضغطة العرض بيتسجل إنه «أُرسل للعميل».
 */
export function WhatsAppButton({
  quoteId,
  phone,
  message,
  label = "إرسال عبر واتساب",
  variant = "primary",
  ...look
}: Look & { quoteId: string; phone: string; message: string }) {
  const router = useRouter();
  return (
    <a
      href={whatsAppUrl(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void markQuoteSent(quoteId).then(() => router.refresh())}
      className={buttonStyles({ variant, ...look })}
    >
      {label}
      <MessageCircle aria-hidden />
    </a>
  );
}

export function CopyLinkButton({ url, label = "نسخ الرابط", variant = "secondary", ...look }: Look & { url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <Button variant={variant} {...look} onClick={copy}>
        <span aria-live="polite">{state === "copied" ? "اتنسخ الرابط" : label}</span>
        <Copy aria-hidden />
      </Button>
      {state === "failed" && (
        <span role="alert" className="break-all text-xs text-ink-2" dir="ltr">
          {url}
        </span>
      )}
    </>
  );
}

/** «نسخ كعرض جديد»: نفس العميل والتفاصيل برقم جديد */
export function DuplicateButton({ quoteId, label = "نسخ كعرض جديد", variant = "ghost", ...look }: Look & { quoteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const duplicate = () =>
    startTransition(async () => {
      const result = await duplicateQuote(quoteId);
      if (!result.ok) return setError(result.message);
      router.push(`/quotes/${result.data.id}/${result.data.tier ? "pricing" : "details"}`);
    });

  return (
    <>
      <Button variant={variant} {...look} onClick={duplicate} disabled={pending}>
        {pending ? "بننسخ..." : label}
        <CopyPlus aria-hidden />
      </Button>
      {error && (
        <span role="alert" className="text-xs text-danger-fg">
          {error}
        </span>
      )}
    </>
  );
}
