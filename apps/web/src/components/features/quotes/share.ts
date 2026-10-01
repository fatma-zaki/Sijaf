import { toWhatsAppNumber } from "@sijaf/shared";
import { formatCurrency } from "@/lib/format";

/** رابط صفحة العميل */
export function publicQuotePath(token: string): string {
  return `/q/${encodeURIComponent(token)}`;
}

/** wa.me برسالة جاهزة؛ الرقم المصري بيتحول لـ 20xxxxxxxxxx */
export function whatsAppUrl(phone: string | null, text: string): string {
  const number = phone ? toWhatsAppNumber(phone) : "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** الرسالة اللي بتتبعت للعميل مع الرابط */
export function quoteShareMessage({
  clientName,
  shopName,
  number,
  total,
  link,
}: {
  clientName: string;
  shopName: string;
  number: number;
  total: number;
  link: string;
}): string {
  const firstName = clientName.trim().split(/\s+/)[0] ?? clientName;
  return [
    `أهلاً ${firstName}،`,
    `ده عرض سعر ${shopName} رقم #${number} بإجمالي ${formatCurrency(total)}.`,
    `تقدر تشوف التفاصيل هنا: ${link}`,
  ].join("\n");
}

/** رسالة العميل للمحل من صفحة العرض */
export function shopContactMessage(number: number): string {
  return `أهلاً، بخصوص عرض السعر رقم #${number}`;
}
