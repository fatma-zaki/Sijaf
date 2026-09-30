import type { ReactNode } from "react";
import { Calculator, Camera, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const benefits = [
  { icon: Camera, text: "صوّر الستارة وخد السعر في أقل من دقيقة" },
  { icon: Calculator, text: "الأسعار بتتحسب من كتالوج محلك وموردينك" },
  { icon: MessageCircle, text: "ابعت العرض للعميل على واتساب بشعار محلك" },
] as const;

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** شاشة الدخول: فورم + لوحة الهوية (جنب بعض على اللابتوب، واللوحة فوق على الموبايل) */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface lg:flex-row">
      <div className="flex flex-col gap-4.5 bg-pine-900 px-5 pb-8 pt-7 text-on-pine lg:hidden">
        <Logo />
        <p className="m-0 text-title font-bold">سعّر أي ستارة في دقيقة، بأسعار محلك</p>
      </div>

      <main className="flex flex-1 justify-center px-5 py-6 lg:items-center lg:py-10">
        <div className="flex w-full max-w-100 flex-col gap-4 md:gap-4.5">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-title font-bold text-ink lg:text-3xl lg:leading-9">{title}</h1>
            {subtitle && <p className="m-0 text-ink-muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-2 text-center text-base text-ink-2 lg:mt-0">{footer}</div>}
        </div>
      </main>

      <aside className="hidden w-155 flex-none flex-col justify-between bg-pine-900 p-14 text-on-pine lg:flex">
        <Logo size="lg" />
        <div className="flex flex-col gap-7">
          <p className="m-0 text-display font-bold">
            سعّر أي ستارة
            <br />
            في دقيقة، بأسعار محلك
          </p>
          <ul className="m-0 flex list-none flex-col gap-7 p-0">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5 text-lead">
                <span className="grid size-10 flex-none place-items-center rounded-md bg-pine-700">
                  <Icon aria-hidden className="size-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <span className="text-sm text-on-pine-muted">سِجاف · نظام تسعير لمحلات الستائر</span>
      </aside>
    </div>
  );
}
