"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

/**
 * خطأ وقت تحميل صفحة (غالبًا الـ API مش متاح أو النت فاصل).
 * في الإنتاج رسالة الخطأ الأصلية مابتوصلش للمتصفح، فبنعرض رسالة عامة وزرار يعيد التحميل من السيرفر.
 */
export function LoadError({ retry, className }: { retry: () => void; className?: string }) {
  return (
    <Card className={cn("flex grow flex-col p-0", className)}>
      <EmptyState
        icon={<WifiOff aria-hidden />}
        title="مش قادرين نحمّل الصفحة دي"
        description="ممكن النت يكون فاصل أو السيرفر بيصحى. استنى ثواني وجرّب تاني."
        actions={
          <Button size="lg" onClick={retry}>
            جرّب تاني
            <RefreshCw aria-hidden />
          </Button>
        }
      />
    </Card>
  );
}
