"use client";

import { FileDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type PdfButtonProps = { token: string; number: number; label?: string; variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string };

/** الـ PDF بيتعمل على السيرفر في كام ثانية، فبنحمّله هنا عشان يبان إنه شغال */
export function PdfButton({ token, number, label = "تحميل PDF", variant = "secondary", ...look }: PdfButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/q/${encodeURIComponent(token)}/pdf`);
      if (!response.ok) throw new Error(await response.text());
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `عرض-سعر-${number}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError("معرفناش نجهّز الـ PDF، جرّب تاني");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant={variant} {...look} onClick={download} disabled={pending} aria-busy={pending}>
        {pending ? "بنجهّز الملف..." : label}
        {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : <FileDown aria-hidden />}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-danger-fg">
          {error}
        </span>
      )}
    </>
  );
}
