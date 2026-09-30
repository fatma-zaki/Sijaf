"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { isActive } from "./nav-items";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** Link بيعلّم نفسه aria-current="page" لو هو الصفحة الحالية؛ الستايل بيعتمد على aria-current */
export function NavLink({ href, ...props }: NavLinkProps) {
  const pathname = usePathname();
  return <Link href={href} aria-current={isActive(href, pathname) ? "page" : undefined} {...props} />;
}
