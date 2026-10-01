import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, FileText, Inbox, Layers, Pencil, Plus, Search as SearchIcon, Send, Trash2, Upload, Users, CircleCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BarChart } from "@/components/ui/bar-chart";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge, ConfidenceMeter } from "@/components/ui/confidence";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, InputWithUnit, Select, Textarea } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { Logo } from "@/components/ui/logo";
import { Pagination } from "@/components/ui/pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchField } from "@/components/ui/search-field";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Stepper } from "@/components/ui/stepper";
import { TabNav } from "@/components/ui/tab-nav";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ChoiceDemo, ConfirmDemo, ControlsDemo, DialogDemo, TierDemo, UploadDemo } from "./interactive-demos";
import { colorTokens, quoteSteps, sampleMaterials, typeScale, type SampleMaterial } from "./samples";

export const metadata: Metadata = {
  title: "مكوّنات التصميم",
  robots: { index: false },
};

const materialColumns: DataTableColumn<SampleMaterial>[] = [
  { id: "name", header: "الخامة", cell: (row) => <span className="font-semibold text-ink">{row.name}</span> },
  { id: "layer", header: "الطبقة", cell: (row) => row.layer },
  { id: "tier", header: "المستوى", cell: (row) => row.tier },
  { id: "supplier", header: "المورد", cell: (row) => <a href="#">{row.supplier}</a> },
  { id: "purchase", header: "سعر الشراء / متر", numeric: true, cell: (row) => formatCurrency(row.purchase) },
  { id: "sell", header: "سعر البيع / متر", numeric: true, cell: (row) => formatCurrency(row.sell) },
  {
    id: "margin",
    header: "هامش الربح",
    cell: (row) => (
      <span className="flex items-baseline gap-1.5">
        <span className="font-semibold text-growth">{formatCurrency(row.sell - row.purchase)}</span>
        <span className="text-xs text-ink-muted">{formatPercent(((row.sell - row.purchase) / row.sell) * 100)}</span>
      </span>
    ),
  },
  {
    id: "actions",
    header: <span className="sr-only">إجراءات</span>,
    cell: (row) => (
      <div className="flex gap-1">
        <button type="button" aria-label={`تعديل ${row.name}`} className={buttonStyles({ variant: "ghost", size: "sm", iconOnly: true })}>
          <Pencil aria-hidden />
        </button>
        <button type="button" aria-label={`حذف ${row.name}`} className={buttonStyles({ variant: "danger-ghost", size: "sm", iconOnly: true })}>
          <Trash2 aria-hidden />
        </button>
      </div>
    ),
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card aria-label={title} className="flex flex-col gap-4">
      <CardTitle>{title}</CardTitle>
      {children}
    </Card>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-275 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-4xl font-bold text-ink">مكوّنات سِجاف</h1>
        <p className="m-0 text-ink-muted">
          كل مكوّنات <code dir="ltr">components/ui</code> للمقارنة بـ <code dir="ltr">design/sijaf-html</code>. غيّر عرض
          الشاشة عشان تشوف الموبايل (&lt;600) والتابلت (600–1024) واللابتوب.
        </p>
      </header>

      <Section title="الألوان">
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4 lg:grid-cols-7">
          {colorTokens.map((token) => (
            <li key={token} className="flex flex-col gap-1.5">
              {/* اسم الـ token متغير، فاللون بييجي من الـ CSS variable */}
              <span className="h-12 rounded-md border border-border" style={{ background: `var(--color-${token})` }} />
              <code dir="ltr" className="text-2xs text-ink-muted">{token}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="الخطوط">
        <div className="flex flex-col gap-3">
          {typeScale.map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-b-0">
              <span className={item.className}>سعّر أي ستارة في دقيقة · 10,700 ج.م</span>
              <code dir="ltr" className="text-2xs text-ink-muted">{item.label}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="الأزرار">
        <div className="flex flex-wrap items-center gap-3">
          <Button>عرض سعر جديد <Plus aria-hidden /></Button>
          <Button variant="secondary">استيراد من Excel <Upload aria-hidden /></Button>
          <Button variant="soft">اختر</Button>
          <Button variant="ghost">إضافة بند <Plus aria-hidden /></Button>
          <Button variant="danger">حذف نهائي</Button>
          <Button variant="danger-ghost">حذف</Button>
          <Button disabled>معطّل</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">صوّر وسعّر ستارة</Button>
          <Button size="sm">موديل جديد <Plus aria-hidden /></Button>
          <Button variant="ghost" iconOnly aria-label="تعديل"><Pencil aria-hidden /></Button>
          <Button variant="danger-ghost" size="sm" iconOnly aria-label="حذف"><Trash2 aria-hidden /></Button>
          <Link href="#" className={buttonStyles({ variant: "secondary" })}>لينك بشكل زرار</Link>
        </div>
        <div className="max-w-80">
          <Button block variant="secondary">كل المواعيد</Button>
        </div>
      </Section>

      <Section title="الحالات">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="neutral">مسودة</StatusBadge>
          <StatusBadge tone="warning" icon={<Clock aria-hidden />}>قيد المراجعة</StatusBadge>
          <StatusBadge tone="info" icon={<Send aria-hidden />}>أُرسل للعميل</StatusBadge>
          <StatusBadge tone="success" icon={<CircleCheck aria-hidden />}>تم القبول</StatusBadge>
          <StatusBadge tone="brand">الأكثر استخداماً</StatusBadge>
        </div>
      </Section>

      <Section title="الكروت والإحصائيات">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard value="142" label="إجمالي العملاء" delta="+18" icon={<Users aria-hidden />} />
          <StatCard value="24" label="إجمالي العروض هذا الشهر" delta="+12%" icon={<FileText aria-hidden />} />
          <StatCard value="16" label="عروض قبلها العملاء" icon={<CircleCheck aria-hidden />} />
          <StatCard value="8" label="عروض اليوم" delta="-20%" icon={<FileText aria-hidden />} />
          <MetricCard label="قيمة العروض المقبولة" value="164,300 ج.م" hint="16 عرض · نسبة القبول 67%" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>آخر عروض الأسعار</CardTitle>
            <a href="#" className="text-sm font-semibold">عرض الكل</a>
          </CardHeader>
          <p className="m-0">محتوى الكارت.</p>
        </Card>
      </Section>

      <Section title="خطوات العرض (Stepper)">
        <Stepper label="خطوات إنشاء العرض" steps={quoteSteps} current={1} />
      </Section>

      <Section title="مستويات السعر (TierCard)">
        <TierDemo />
      </Section>

      <Section title="الجدول (DataTable) والصفحات">
        <div className="overflow-hidden rounded-lg border border-border">
          <DataTable label="الخامات" columns={materialColumns} rows={sampleMaterials} getRowKey={(row) => row.id} />
          <Pagination summary="عرض 4 من 25 خامة" nextHref="#" className="border-t border-border" />
        </div>
      </Section>

      <Section title="الحقول">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="اسم العميل">
            <Input placeholder="مثال: أحمد محمد" />
          </Field>
          <Field label="رقم الموبايل (واتساب)" hint="هيتبعتله العرض على الرقم ده">
            <Input type="tel" dir="ltr" placeholder="01xxxxxxxxx" />
          </Field>
          <Field label="الطبقة">
            <Select defaultValue="main">
              <option value="main">قماش أساسي</option>
              <option value="sheer">شيفون</option>
            </Select>
          </Field>
          <Field label="سعر الشراء" error="السعر لازم يبقى أكبر من صفر">
            <InputWithUnit unit="ج.م" inputMode="decimal" aria-invalid defaultValue="0" />
          </Field>
          <Field label="ملاحظات داخلية" className="md:col-span-2">
            <Textarea rows={2} placeholder="مش بتظهر للعميل" />
          </Field>
          <SearchField placeholder="ابحث باسم الخامة أو المورد..." className="md:col-span-2" />
        </div>
        <ControlsDemo />
      </Section>

      <Section title="التنبيهات (InfoNote)">
        <InfoNote>كل هذه المعلومات سيتم تحديدها تلقائياً، ويمكنك مراجعتها وتعديلها لاحقاً. السعر يُحسب من كتالوج محلك.</InfoNote>
        <InfoNote tone="success">تم تحليل الصورة بنجاح</InfoNote>
        <InfoNote tone="warning">
          كتالوج الأسعار لسه فاضي، فالعروض هتطلع من غير أسعار. <a href="#" className="font-bold text-warning-fg">ضيف أسعارك الأول</a>
        </InfoNote>
      </Section>

      <Section title="الثقة والتقدم">
        <div className="flex flex-wrap gap-2">
          <ConfidenceBadge value={92} />
          <ConfidenceBadge value={78} />
          <ConfidenceBadge value={64} />
        </div>
        <div className="max-w-120 rounded-md border border-border">
          <ConfidenceMeter icon={<Layers aria-hidden />} label="الموديل" value={90} />
          <ConfidenceMeter icon={<Layers aria-hidden />} label="القماش الأساسي" value={88} />
        </div>
        <ProgressBar label="تقدم التحليل" value={65} className="max-w-120" />
        <BarChart
          label="عدد العروض"
          unit="عرض"
          className="max-w-120"
          data={[
            { label: "أبريل", value: 14 },
            { label: "مايو", value: 17 },
            { label: "يونيو", value: 15 },
            { label: "يوليو", value: 21 },
          ]}
        />
      </Section>

      <Section title="رفع الصورة">
        <UploadDemo />
      </Section>

      <Section title="التبويبات والهوية">
        <TabNav
          label="أقسام الكتالوج"
          items={[
            { href: "#materials", label: "الخامات", count: 25, current: true },
            { href: "#suppliers", label: "الموردين", count: 5, current: false },
            { href: "#models", label: "الموديلات", count: 8, current: false },
          ]}
        />
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-md bg-pine-900 px-4 py-3 text-on-pine"><Logo /></span>
          <Logo className="text-ink" />
          <Logo markOnly />
          <Avatar name="محمد" />
          <Avatar name="عمرو خالد" size="sm" />
        </div>
      </Section>

      <Section title="الحالة الفاضية (EmptyState)">
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={<Inbox aria-hidden />}
            title="لسه ماعملتش أي عرض سعر"
            description="صوّر الستارة أو ارفع صورة من العميل، وسِجاف يطلعلك 3 أسعار من كتالوج محلك في أقل من دقيقة."
            actions={<Link href="#" className={buttonStyles({ size: "lg" })}>اعمل أول عرض سعر <Plus aria-hidden /></Link>}
          >
            <InfoNote tone="warning">كتالوج الأسعار لسه فاضي، فالعروض هتطلع من غير أسعار.</InfoNote>
          </EmptyState>
        </div>
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={<SearchIcon aria-hidden />}
            title="مفيش نتايج"
            description="جرّب كلمة تانية أو شيل الفلاتر."
          />
        </div>
      </Section>

      <Section title="كروت الاختيار (ChoiceCard)">
        <ChoiceDemo />
      </Section>

      <Section title="النوافذ (Dialog وConfirmDialog)">
        <div className="flex flex-wrap gap-3">
          <DialogDemo />
          <ConfirmDemo />
        </div>
      </Section>
    </main>
  );
}
