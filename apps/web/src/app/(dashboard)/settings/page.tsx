import type { UserDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { AddTechnicianForm } from "@/components/features/shop/add-technician-form";
import { ShopProfileForm } from "@/components/features/shop/shop-profile-form";
import { TeamList } from "@/components/features/shop/team-list";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { apiRequest } from "@/lib/api/server";
import { requireOwner } from "@/lib/auth/session";

export const metadata: Metadata = { title: "إعدادات المحل" };

export default async function SettingsPage() {
  const { shop } = await requireOwner();
  const users = await apiRequest<UserDto[]>("/users");

  return (
    <>
      <PageHeader title="إعدادات المحل" backHref="/more" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="flex flex-col gap-4">
          <CardTitle>بيانات المحل</CardTitle>
          <ShopProfileForm shop={shop} submitLabel="حفظ التغييرات" />
        </Card>
        <Card className="flex flex-col gap-3">
          <CardTitle>تكاليف وقواعد تانية</CardTitle>
          <InfoNote>
            التركيب والكرنيشة وعرض التوب والعربون وصلاحية العرض بتتظبط هنا مع محرك التسعير في المرحلة 4. رفع الشعار جاي
            مع صفحة العرض والـ PDF في المرحلة 5.
          </InfoNote>
        </Card>
        <Card className="flex flex-col gap-2 lg:col-span-2">
          <CardTitle>المستخدمين</CardTitle>
          <TeamList users={users} />
          <p className="m-0 text-xs text-ink-muted">الفني مابيشوفش أسعار الشراء ولا هامش الربح.</p>
          <details className="group mt-2 rounded-md border border-border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 font-semibold text-primary">
              إضافة فني
            </summary>
            <div className="border-t border-border p-4">
              <AddTechnicianForm />
            </div>
          </details>
        </Card>
      </div>
    </>
  );
}
