"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type UploadDropProps = {
  onFiles: (files: File[]) => void;
  title: string;
  buttonLabel: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
};

export function UploadDrop({
  onFiles,
  title,
  buttonLabel,
  hint,
  accept = "image/*",
  multiple = false,
  className,
}: UploadDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center gap-3 rounded-md border-[1.5px] border-dashed p-8 text-center",
        isOver ? "border-primary bg-primary-soft" : "border-border-strong bg-surface-subtle",
        className,
      )}
    >
      <ImagePlus aria-hidden className="size-10 text-primary" />
      <p className="m-0 text-md font-semibold text-ink">{title}</p>
      <span className="text-xs text-ink-muted">أو</span>
      <Button onClick={() => inputRef.current?.click()}>
        {buttonLabel}
        <Upload aria-hidden />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          event.target.value = "";
        }}
      />
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
