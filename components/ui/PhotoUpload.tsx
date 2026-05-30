"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { compressImage, formatFileSize } from "@/lib/utils/compress-image";
import type { Plan } from "@/types";

const LIMIT: Record<Plan, number> = {
  basic: 20,
  pro: 40,
  vip: 9999,
};

type Props = {
  cardId: string;
  plan: Plan;
  currentCount: number;
  bucket: "wedding-photos" | "wedding-music";
  accept: Record<string, string[]>;
  maxFiles?: number;
  /** Override album plan limit (e.g. single cover = 1) */
  maxTotal?: number;
  onUploaded: (publicUrl: string) => void;
  label?: string;
};

export function PhotoUpload({
  cardId,
  plan,
  currentCount,
  bucket,
  accept,
  maxFiles = 10,
  maxTotal,
  onUploaded,
  label = "Kéo thả hoặc bấm để chọn ảnh",
}: Props) {
  const [busy, setBusy] = useState(false);
  const limit = maxTotal ?? LIMIT[plan] ?? 20;

  const onDrop = useCallback(
    async (files: File[]) => {
      if (currentCount >= limit) {
        toast.error(`Đã đạt giới hạn ${limit} ảnh cho gói hiện tại`);
        return;
      }
      const supabase = createClient();
      setBusy(true);
      try {
        for (const file of files.slice(0, maxFiles)) {
          if (currentCount >= limit) break;
          
          // Nén ảnh nếu là file ảnh
          let processedFile = file;
          if (file.type.startsWith("image/")) {
            try {
              const originalSize = formatFileSize(file.size);
              processedFile = await compressImage(file, {
                maxWidth: 2560,
                maxHeight: 1920,
                quality: 88,
              });
              const compressedSize = formatFileSize(processedFile.size);
              console.log(`Ảnh nén: ${originalSize} → ${compressedSize}`);
            } catch (err) {
              console.warn("Không thể nén ảnh, sử dụng ảnh gốc:", err);
              // Tiếp tục với ảnh gốc nếu nén lỗi
            }
          }
          
          const ext = processedFile.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "bin");
          const path = `${cardId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, processedFile, {
            cacheControl: "3600",
            upsert: false,
          });
          if (upErr) {
            toast.error(upErr.message);
            continue;
          }
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          onUploaded(pub.publicUrl);
        }
      } finally {
        setBusy(false);
      }
    },
    [bucket, cardId, currentCount, limit, maxFiles, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    disabled: busy || currentCount >= limit,
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
        isDragActive ? "border-mewedding-rose bg-rose-50" : "border-neutral-200 hover:border-mewedding-rose/50"
      } ${busy ? "opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      <p>{busy ? "Đang tải lên…" : label}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Còn lại {Math.max(0, limit - currentCount)} / {limit}
      </p>
    </div>
  );
}
