import { cn } from "@/lib/cn";

type AvatarProps = {
  name: string;
  size?: "sm" | "md";
  className?: string;
};

/** أول حرفين من الاسم: «محمد» ← «مح» */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "grid flex-none place-items-center rounded-pill bg-pine-900 font-semibold text-on-pine",
        size === "md" ? "size-10 text-sm" : "size-8 text-xs",
        className,
      )}
    >
      <span aria-hidden>{initials(name)}</span>
    </span>
  );
}
