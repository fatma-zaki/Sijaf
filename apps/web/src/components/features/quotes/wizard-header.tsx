import { PageHeader } from "@/components/layout/page-header";
import { Stepper } from "@/components/ui/stepper";
import { quoteSteps } from "./quote-format";

type WizardHeaderProps = {
  /** 0: الصورة · 1: التفاصيل · 2: التسعير · 3: العرض النهائي */
  step: number;
  title?: string;
  subtitle?: string;
  backHref: string;
};

/** رأس خطوات العرض: العنوان والـ stepper في كارت (شرايط على الموبايل) */
export function WizardHeader({ step, title = "إنشاء عرض سعر جديد", subtitle, backHref }: WizardHeaderProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle ?? <span className="md:hidden">خطوة {step + 1} من {quoteSteps.length}</span>} backHref={backHref} />
      <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card md:px-6 md:py-4">
        <Stepper label="خطوات إنشاء العرض" steps={quoteSteps} current={step} />
      </div>
    </>
  );
}
