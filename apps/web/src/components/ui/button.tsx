import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "danger-ghost";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** زرار أيقونة بس: لازم يبقى معاه aria-label */
  iconOnly?: boolean;
  block?: boolean;
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary",
  secondary: "bg-surface text-ink border-border-strong hover:bg-surface-subtle hover:text-ink",
  soft: "bg-surface-subtle text-ink border-border hover:bg-primary-soft hover:text-ink",
  ghost: "bg-transparent text-primary hover:bg-primary-soft hover:text-primary",
  "danger-ghost": "bg-transparent text-danger-fg hover:bg-surface-subtle hover:text-danger-fg",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-5 text-base",
  lg: "h-11 px-5 text-base",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "w-8 px-0",
  md: "w-10 px-0",
  lg: "w-11 px-0",
};

/** نفس ستايل الزرار عشان يتحط على Link أو أي عنصر تاني */
export function buttonStyles({
  variant = "primary",
  size = "md",
  iconOnly = false,
  block = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    "touch-target inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent font-semibold no-underline transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    iconOnly && iconSizes[size],
    block && "flex w-full",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & Omit<ButtonStyleOptions, "className">;

export function Button({
  variant,
  size,
  iconOnly,
  block,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, iconOnly, block, className })}
      {...props}
    />
  );
}
