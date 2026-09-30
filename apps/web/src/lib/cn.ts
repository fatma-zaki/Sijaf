import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// لازم tailwind-merge يعرف أحجام الخط والـ radius والـ shadows بتاعة سِجاف،
// وإلا هيعتبر text-md لون ويشيل text-ink.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["2xs", "xs", "sm", "base", "md", "lead", "lg", "xl", "2xl", "title", "3xl", "4xl", "display"],
      radius: ["sm", "md", "lg", "pill"],
      shadow: ["card", "raised"],
      breakpoint: ["md", "lg", "xl"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
