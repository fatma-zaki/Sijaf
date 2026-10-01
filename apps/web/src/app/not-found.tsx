import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4">
      <EmptyState
        icon={<SearchX aria-hidden />}
        title="الصفحة دي مش موجودة"
        description="ممكن الرابط يكون اتكتب غلط أو العرض اتلغى. لو الرابط جالك من محل، كلّمهم يبعتوهولك تاني."
        actions={
          <Link href="/" className={buttonStyles({ variant: "secondary" })}>
            الصفحة الرئيسية
          </Link>
        }
      />
    </main>
  );
}
