import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

const sizes: Record<LogoSize, { text: string; mark: number }> = {
  sm: { text: "gap-1.75 text-[22px]", mark: 28 },
  md: { text: "gap-2 text-[26px]", mark: 32 },
  lg: { text: "gap-2.5 text-[32px]", mark: 40 },
};

type LogoProps = {
  size?: LogoSize;
  /** من غير الكلمة: للـ IconRail */
  markOnly?: boolean;
  className?: string;
};

/** شعار سِجاف: لون الكلمة بييجي من currentColor */
export function Logo({ size = "md", markOnly = false, className }: LogoProps) {
  const { text, mark } = sizes[size];
  return (
    <span role="img" aria-label="سِجاف" className={cn("inline-flex items-center font-bold leading-none", text, className)}>
      <svg width={mark} height={mark} viewBox="0 0 48 48" aria-hidden className="flex-none">
        <rect x="3" y="3" width="42" height="42" rx="11" className="fill-pine-700" />
        <rect x="11" y="11" width="26" height="2.5" rx="1.25" fill="#ffffff" />
        <path d="M12 16H22.5V37H12Z" fill="#ffffff" />
        <path d="M36 16H25.5V24L36 37Z" fill="#7cc4ba" />
      </svg>
      {!markOnly && <span aria-hidden>سِجاف</span>}
    </span>
  );
}
