"use client";

import { useState } from "react";
import { compressImage } from "@/lib/image/compress";

type UploadState = { busy: boolean; progress: string | null; error: string | null };

/** ضغط الصور في المتصفح ورفعها واحدة واحدة للعرض */
export function usePhotoUpload() {
  const [state, setState] = useState<UploadState>({ busy: false, progress: null, error: null });

  /** بيرجّع true لو كل الصور اترفعت */
  const upload = async (quoteId: string, files: readonly File[]): Promise<boolean> => {
    setState({ busy: true, progress: null, error: null });
    try {
      for (const [index, file] of files.entries()) {
        setState({ busy: true, error: null, progress: files.length > 1 ? `بنرفع الصورة ${index + 1} من ${files.length}...` : "بنرفع الصورة..." });
        const blob = await compressImage(file);
        const form = new FormData();
        form.append("photo", blob, "curtain.jpg");
        const response = await fetch(`/api/quotes/${quoteId}/photos`, { method: "POST", body: form });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "الصورة ماترفعتش، جرّب تاني");
        }
      }
      setState({ busy: false, progress: null, error: null });
      return true;
    } catch (error) {
      // fetch بيرمي TypeError لما النت يقطع
      const message =
        error instanceof TypeError
          ? "النت فاصل، جرّب تاني"
          : error instanceof Error
            ? error.message
            : "الصورة ماترفعتش، جرّب تاني";
      setState({ busy: false, progress: null, error: message });
      return false;
    }
  };

  return { ...state, upload };
}
