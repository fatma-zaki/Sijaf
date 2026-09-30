"use client";

import type { ShopDto } from "@sijaf/shared";
import { useRouter } from "next/navigation";
import { ShopProfileForm } from "@/components/features/shop/shop-profile-form";

export function ShopStepForm({ shop }: { shop: ShopDto }) {
  const router = useRouter();
  return <ShopProfileForm shop={shop} submitLabel="حفظ ومتابعة" onSaved={() => router.push("/onboarding/prices")} />;
}
