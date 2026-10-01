"use client";

import { useEffect, useState } from "react";
import { useUrlParams } from "@/lib/use-url-params";
import { SearchField } from "./search-field";

const SEARCH_DELAY_MS = 300;

/** بحث مربوط بـ ?q= في الـ URL، بيستنى المستخدم يخلص كتابة */
export function UrlSearchField({ placeholder, className }: { placeholder: string; className?: string }) {
  const { params, update } = useUrlParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: query }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, params, update]);

  return <SearchField placeholder={placeholder} value={query} onChange={(event) => setQuery(event.target.value)} className={className} />;
}
