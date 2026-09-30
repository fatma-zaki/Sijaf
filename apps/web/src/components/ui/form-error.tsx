import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

/** رسالة خطأ عامة للفورم (مش لحقل معيّن) */
export function FormError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn("flex items-center gap-2 rounded-md bg-warning-soft px-4 py-3 text-sm font-medium text-danger-fg", className)}
    >
      <TriangleAlert aria-hidden className="size-4 flex-none text-danger" />
      {message}
    </div>
  );
}
