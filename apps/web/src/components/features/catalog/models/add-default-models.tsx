"use client";

import { Blinds, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";
import { addDefaultModels } from "../actions";

/** محل ماعندوش موديلات: الـ 8 الجاهزين بضغطة، أو موديل من الصفر */
export function AddDefaultModels() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="p-0">
      <EmptyState
        icon={<Blinds aria-hidden />}
        title="لسه مفيش موديلات"
        description="ابدأ بالـ 8 موديلات الجاهزة (كسرات، حلقات، ويفي، رومانية، رول…) وعدّل الكشكشة والمصنعية لأسعارك."
        actions={
          <>
            <Button
              size="lg"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await addDefaultModels();
                  setError(result.ok ? null : result.message);
                })
              }
            >
              {pending ? "بنضيف..." : "ضيف الموديلات الجاهزة"}
            </Button>
            <Link href="/catalog/models?model=new" className={buttonStyles({ size: "lg", variant: "secondary" })}>
              موديل من الصفر
              <Plus aria-hidden />
            </Link>
          </>
        }
      >
        <FormError message={error ?? undefined} />
      </EmptyState>
    </Card>
  );
}
