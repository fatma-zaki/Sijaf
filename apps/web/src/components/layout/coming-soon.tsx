import { Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/** مكان الصفحات اللي لسه ماتبنتش (مؤقت لحد مرحلتها) */
export function ComingSoon({ phase, what }: { phase: number; what: string }) {
  return (
    <Card className="flex grow flex-col p-0">
      <EmptyState
        icon={<Hammer aria-hidden />}
        title="الصفحة دي لسه بتتبني"
        description={`${what} جاية في المرحلة ${phase}.`}
      />
    </Card>
  );
}
