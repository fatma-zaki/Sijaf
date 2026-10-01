"use client";

import { quoteStatuses, quoteStatusLabels, type QuoteStatus } from "@sijaf/shared";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, InputWithUnit, Select, Textarea } from "@/components/ui/field";
import { updateQuote } from "./actions";

type QuoteStatusFormProps = {
  quoteId: string;
  status: QuoteStatus;
  internalNotes: string;
  finalTotal: number | null;
  /** العرض اللي لسه ماتسعّرش حالته بتفضل مسودة */
  priced: boolean;
};

/** «حالة العرض»: الحالة بتتحفظ أول ما تتغير، والملاحظات لما تسيب الخانة */
export function QuoteStatusForm({ quoteId, status, internalNotes, finalTotal, priced }: QuoteStatusFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(internalNotes);
  const [savedNotes, setSavedNotes] = useState(internalNotes);
  const [final, setFinal] = useState(finalTotal === null ? "" : String(finalTotal));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const save = (changes: { status?: QuoteStatus; internalNotes?: string; finalTotal?: number | null }, done: string) =>
    startTransition(async () => {
      const result = await updateQuote(quoteId, changes);
      if (!result.ok) return setMessage({ ok: false, text: result.fieldErrors?.internalNotes ?? result.fieldErrors?.finalTotal ?? result.message });
      setSavedNotes(result.data.internalNotes);
      setMessage({ ok: true, text: done });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <Field label="الحالة" hint={priced ? undefined : "سعّر العرض الأول عشان تغيّر حالته"}>
        <Select
          value={status}
          disabled={!priced || pending}
          onChange={(event) => save({ status: event.target.value as QuoteStatus }, "اتغيّرت الحالة")}
        >
          {quoteStatuses.map((value) => (
            <option key={value} value={value}>
              {quoteStatusLabels[value]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="ملاحظات داخلية">
        <Textarea
          rows={2}
          maxLength={1000}
          placeholder="مش بتظهر للعميل"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => notes.trim() !== savedNotes && save({ internalNotes: notes }, "اتحفظت الملاحظات")}
          className="resize-none"
        />
      </Field>
      {priced && (
        <Field label="السعر النهائي بعد المعاينة" hint="اختياري؛ بيحسب دقة التسعير في التقارير">
          <InputWithUnit
            unit="ج.م"
            inputMode="decimal"
            value={final}
            onChange={(event) => setFinal(event.target.value)}
            onBlur={() => {
              const value = final.trim() === "" ? null : Number(final);
              if (value !== null && !Number.isFinite(value)) return setMessage({ ok: false, text: "اكتب رقم" });
              if (value !== finalTotal) save({ finalTotal: value }, "اتحفظ السعر النهائي");
            }}
          />
        </Field>
      )}
      <span role="status" className={message?.ok === false ? "text-xs text-danger-fg" : "text-xs font-semibold text-success"}>
        {pending ? "بنحفظ..." : message?.text}
      </span>
    </div>
  );
}
