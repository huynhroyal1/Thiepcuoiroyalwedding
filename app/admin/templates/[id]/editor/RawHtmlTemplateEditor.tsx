"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InvitationHTMLViewer } from "@/components/invitation/InvitationHTMLViewer";
import { saveTemplateContentJson } from "@/app/actions/admin";
import { templatePreviewHrefWithVersion } from "@/lib/marketing/template-preview-url";
import type { TemplateRow } from "@/types";

function extractHtml(content: unknown): string {
  if (content && typeof content === "object" && (content as Record<string, unknown>).type === "raw-html") {
    const html = (content as Record<string, unknown>).html;
    return typeof html === "string" ? html : "";
  }
  return "";
}

function resolveTemplatePreviewHref(template: TemplateRow, version: number): string {
  return templatePreviewHrefWithVersion(template, version);
}

export function RawHtmlTemplateEditor({ template }: { template: TemplateRow }) {
  const initialHtml = useMemo(() => extractHtml(template.content_json), [template.content_json]);
  const [html, setHtml] = useState(initialHtml);
  const [previewHtml, setPreviewHtml] = useState(initialHtml);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHtml(initialHtml);
    setPreviewHtml(initialHtml);
    setDirty(false);
  }, [template.id, initialHtml]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewHtml(html), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [html]);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const result = await saveTemplateContentJson(template.id, {
        type: "raw-html",
        html: html.trim(),
      });
      if (result.error) {
        setSaveError(result.error);
        setSaveStatus("error");
        return;
      }
      setSaveError(null);
      setSaveStatus("saved");
      setPreviewVersion((v) => v + 1);
      setDirty(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Lỗi không xác định");
      setSaveStatus("error");
    }
  }, [html, template.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const previewHref = resolveTemplatePreviewHref(template, previewVersion);
  const sizeKb = Math.round(html.length / 1024);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/templates"
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Danh sách
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-gray-900">Mẫu HTML: {template.name}</h1>
            <p className="text-xs text-gray-500">
              MeHappy import · {sizeKb} KB · Sửa HTML trực tiếp, xem trước bên phải
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Xem công khai
            </a>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveStatus === "saving"}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saveStatus === "saving" ? "Đang lưu…" : dirty ? "Lưu mẫu *" : "Lưu mẫu"}
          </button>
        </div>
      </header>

      <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-950 sm:text-sm">
        Chỉnh <strong>mẫu gốc HTML</strong> — khách chọn mẫu mới nhận bản này. Ctrl/Cmd+S để lưu nhanh.
      </div>

      {saveStatus === "saved" && (
        <div className="absolute top-16 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          ✓ Đã lưu mẫu HTML
        </div>
      )}
      {saveStatus === "error" && (
        <div className="absolute top-16 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-center text-sm text-white shadow-lg">
          ✕ Lưu thất bại{saveError ? `: ${saveError}` : ""}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">HTML</span>
            <button
              type="button"
              onClick={() => setPreviewHtml(html)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Cập nhật xem trước ngay
            </button>
          </div>
          <textarea
            value={html}
            onChange={(e) => {
              setHtml(e.target.value);
              setDirty(true);
            }}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none border-0 bg-gray-950 p-4 font-mono text-xs leading-relaxed text-green-100 outline-none"
            aria-label="Chỉnh sửa HTML mẫu thiệp"
          />
        </div>

        <div className="flex w-[420px] shrink-0 flex-col overflow-hidden bg-gray-100">
          <div className="shrink-0 border-b border-gray-200 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Xem trước (390px)
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="mx-auto overflow-hidden rounded-[20px] border-[6px] border-gray-800 bg-white shadow-xl">
              <div className="flex h-6 items-center justify-center bg-gray-900">
                <div className="h-2 w-16 rounded-full bg-gray-700" />
              </div>
              <div className="w-[390px] max-w-full overflow-x-clip">
                <InvitationHTMLViewer html={previewHtml} />
              </div>
              <div className="flex h-5 items-center justify-center border-t border-gray-100 bg-white">
                <div className="h-1 w-24 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
