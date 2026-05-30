"use client";

import React, { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useEditorUploadScope } from "../../EditorContext";
import { compressImage, formatFileSize } from "@/lib/utils/compress-image";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export function ImageUrlInput({
  value,
  onChange,
  placeholder = "https://... hoặc tải ảnh lên",
}: ImageUrlInputProps) {
  const uploadScope = useEditorUploadScope();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!uploadScope) {
      toast.error("Không xác định được thiệp để tải ảnh");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)");
      return;
    }

    setUploading(true);
    try {
      // Nén ảnh trước
      let processedFile = file;
      try {
        const originalSize = formatFileSize(file.size);
        processedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
        });
        const compressedSize = formatFileSize(processedFile.size);
        console.log(`Ảnh editor nén: ${originalSize} → ${compressedSize}`);
      } catch (err) {
        console.warn("Không thể nén ảnh, sử dụng ảnh gốc:", err);
      }

      // Check size SAU khi nén
      if (processedFile.size > MAX_BYTES) {
        toast.error(`Ảnh sau nén vẫn ${formatFileSize(processedFile.size)}, tối đa ${formatFileSize(MAX_BYTES)}`);
        setUploading(false);
        return;
      }

      const supabase = createClient();
      const ext = processedFile.type === "image/webp" ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "jpg");
      const path = `${uploadScope}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("wedding-photos").upload(path, processedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: processedFile.type,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("wedding-photos").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Đã tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 w-full">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading || !uploadScope}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-3.5 w-3.5" aria-hidden />
          )}
          {uploading ? "Đang tải…" : "Tải ảnh lên"}
        </button>
        <span className="text-[10px] text-gray-400">JPG, PNG, WebP · tối đa 5MB</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="relative w-full aspect-video max-h-28 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
