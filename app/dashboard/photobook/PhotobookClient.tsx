"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { addWeddingPhoto, deleteWeddingPhoto, updateWeddingPhotoCaption } from "@/app/actions/wedding-card";
import { createClient } from "@/lib/supabase/client";
import { compressImage, formatFileSize } from "@/lib/utils/compress-image";
import type { Plan, WeddingPhoto } from "@/types";

interface Props {
  cardId: string | null;
  plan: Plan;
  photoLimit: number;
  photobookEnabled: boolean;
  initialPhotos: WeddingPhoto[];
}

export default function PhotobookClient({
  cardId,
  plan,
  photoLimit,
  photobookEnabled,
  initialPhotos,
}: Props) {
  const confirmDialog = useConfirm();
  const [photos, setPhotos] = useState<WeddingPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limit = photoLimit;
  const atLimit = photos.length >= limit;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!cardId) {
        toast.error("Vui lòng tạo thiệp trước khi tải ảnh.");
        return;
      }
      const supabase = createClient();
      const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArr.length === 0) return;

      const remaining = limit - photos.length;
      const toUpload = fileArr.slice(0, remaining);
      if (toUpload.length === 0) {
        toast.error("Đã đạt giới hạn ảnh cho gói hiện tại.");
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const uploaded: WeddingPhoto[] = [];
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        
        // Nén ảnh photobook
        let processedFile = file;
        try {
          const originalSize = formatFileSize(file.size);
          processedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 80,
          });
          const compressedSize = formatFileSize(processedFile.size);
          console.log(`Photobook nén: ${originalSize} → ${compressedSize}`);
        } catch (err) {
          console.warn("Không thể nén ảnh, sử dụng ảnh gốc:", err);
        }

        const ext = processedFile.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const storagePath = `${cardId}/${filename}`;

        const { error: storageError } = await supabase.storage
          .from("wedding-photos")
          .upload(storagePath, processedFile);

        if (storageError) {
          toast.error(`Lỗi tải ảnh: ${storageError.message}`);
          setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("wedding-photos").getPublicUrl(storagePath);

        const { error: dbError, photo } = await addWeddingPhoto(cardId, publicUrl);

        if (dbError) {
          toast.error(`Lỗi lưu ảnh: ${dbError}`);
        } else if (photo) {
          uploaded.push(photo);
        }

        setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
      }

      setPhotos((prev) => [...prev, ...uploaded]);
      setUploading(false);
      if (uploaded.length > 0) toast.success(`Đã tải lên ${uploaded.length} ảnh.`);
    },
    [cardId, limit, photos.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleSaveCaption = async (id: string) => {
    const { error } = await updateWeddingPhotoCaption(id, editCaption);
    if (error) {
      toast.error(error);
    } else {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, caption: editCaption } : p))
      );
      setEditingId(null);
      toast.success("Đã cập nhật chú thích.");
    }
  };

  const handleDelete = async (photo: WeddingPhoto) => {
    const ok = await confirmDialog({
      title: "Xóa ảnh",
      message: "Bạn có chắc muốn xóa ảnh này?",
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    const supabase = createClient();
    const urlParts = photo.url.split("/wedding-photos/");
    if (urlParts.length > 1) {
      await supabase.storage.from("wedding-photos").remove([urlParts[1]]);
    }
    const { error } = await deleteWeddingPhoto(photo.id);
    if (error) {
      toast.error(error);
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success("Đã xóa ảnh.");
    }
  };

  if (!photobookEnabled) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-8 text-center">
        <p className="font-medium text-amber-900">Photobook thuộc gói Pro trở lên</p>
        <p className="mt-2 text-sm text-amber-800">
          Bạn vẫn có thể thêm ảnh trong tab Album tại Thiết lập thiệp (giới hạn theo gói).
        </p>
        <a href="/dashboard/goi-dich-vu" className="mt-4 inline-block rounded-lg bg-rose-500 px-4 py-2 text-sm text-white">
          Nâng cấp gói
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Quản lý Photobook</h1>
          <p className="mt-1 text-sm text-neutral-500">Lưu giữ những khoảnh khắc đẹp nhất và chia sẻ cùng khách mời qua thiệp cưới của bạn.</p>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600">
          {photos.length} / {limit} ảnh
        </span>
      </div>

      {/* Usage bar */}
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-300"
            style={{ width: `${Math.min((photos.length / limit) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-neutral-400">
          Gói <span className="font-semibold uppercase">{plan}</span> — giới hạn {limit} ảnh
        </p>
      </div>

      {/* Upsell banner */}
      {atLimit && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="font-semibold text-rose-700">
            Bạn đã đạt giới hạn {limit} ảnh của gói{" "}
            <span className="uppercase">{plan}</span>.
          </p>
          <p className="mt-1 text-sm text-rose-600">
            Nâng cấp gói để tải thêm nhiều ảnh và mở khóa thêm tính năng.
          </p>
          <a
            href="/dashboard/goi-dich-vu"
            className="mt-3 inline-block rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600"
          >
            Nâng cấp gói ngay
          </a>
        </div>
      )}

      {/* Upload area */}
      {!atLimit && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
            isDragging
              ? "border-rose-400 bg-rose-50"
              : "border-neutral-200 hover:border-rose-300 hover:bg-rose-50/40"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3 text-neutral-400">
            <svg
              className="h-12 w-12 text-rose-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="font-medium text-neutral-600">Kéo thả hoặc nhấn để chọn ảnh</p>
              <p className="mt-1 text-sm">Hỗ trợ nhiều ảnh cùng lúc · Còn {limit - photos.length} ảnh</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            <span className="text-sm font-medium text-blue-700">
              Đang tải lên... {uploadProgress}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-1.5 rounded-full bg-blue-400 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center text-neutral-400">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">Chưa có ảnh nào. Hãy tải lên ảnh đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? "Ảnh cưới"}
                className="aspect-square w-full object-cover"
              />

              {/* Action buttons overlay */}
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditingId(photo.id);
                    setEditCaption(photo.caption ?? "");
                  }}
                  className="rounded-lg bg-white/90 p-1.5 text-neutral-600 shadow-sm backdrop-blur-sm hover:bg-white"
                  title="Sửa chú thích"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(photo)}
                  className="rounded-lg bg-white/90 p-1.5 text-red-500 shadow-sm backdrop-blur-sm hover:bg-white"
                  title="Xóa ảnh"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Caption area */}
              <div className="p-2">
                {editingId === photo.id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="min-w-0 flex-1 rounded border border-rose-300 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-rose-400"
                      placeholder="Chú thích ảnh..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCaption(photo.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveCaption(photo.id)}
                      className="rounded bg-rose-500 px-2 py-1 text-xs text-white hover:bg-rose-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <p className="truncate text-xs text-neutral-500">
                    {photo.caption ? (
                      photo.caption
                    ) : (
                      <span className="italic text-neutral-300">Chưa có chú thích</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
