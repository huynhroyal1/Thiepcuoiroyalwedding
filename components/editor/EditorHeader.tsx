"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import Link from "next/link";
import { useEditorUI } from "@/components/editor/EditorUIContext";
import { PUBLISHED_CANVAS_WIDTH } from "@/lib/editor/canvasViewport";
import {
  clampAutosaveMs,
  EDITOR_AUTOSAVE_INTERVAL_PRESETS_SEC,
  EDITOR_AUTOSAVE_MS_DEFAULT,
  EDITOR_AUTOSAVE_MS_MAX,
  EDITOR_AUTOSAVE_MS_MIN,
  formatAutosaveInterval,
  readStoredAutosaveEnabled,
  readStoredAutosaveMs,
  writeStoredAutosaveEnabled,
  writeStoredAutosaveMs,
} from "@/lib/editor/autosavePreferences";
import { flushPendingEditorEdits } from "@/lib/editor/flushPendingEditorEdits";
import { ImageBlock } from "@/components/editor/blocks/ImageBlock";
import { generateElementId } from "@/components/editor/utils/elementId";

interface EditorHeaderProps {
  onSave: (json: string) => Promise<boolean>;
  onPublish?: () => void;
  onQuickBuild?: () => void;
  backHref?: string;
  title?: string;
  saving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  dirtyRef?: React.MutableRefObject<boolean>;
  previewHref?: string;
}

function SettingsPopover({
  onClose,
  autosaveEnabled,
  autosaveMs,
  onAutosaveEnabledChange,
  onAutosaveMsChange,
}: {
  onClose: () => void;
  autosaveEnabled: boolean;
  autosaveMs: number;
  onAutosaveEnabledChange: (enabled: boolean) => void;
  onAutosaveMsChange: (ms: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"vi" | "en">("vi");

  useEffect(() => {
    const storedTheme = localStorage.getItem("editor-theme") as "light" | "dark" | null;
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    const storedLang = localStorage.getItem("editor-lang") as "vi" | "en" | null;
    if (storedLang === "vi" || storedLang === "en") setLang(storedLang);
  }, []);

  const handleTheme = (t: "light" | "dark") => {
    setTheme(t);
    localStorage.setItem("editor-theme", t);
  };

  const handleLang = (l: "vi" | "en") => {
    setLang(l);
    localStorage.setItem("editor-lang", l);
  };

  const autosaveSec = Math.round(autosaveMs / 1000);
  const minSec = Math.round(EDITOR_AUTOSAVE_MS_MIN / 1000);
  const maxSec = Math.round(EDITOR_AUTOSAVE_MS_MAX / 1000);

  const handleAutosaveSec = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    onAutosaveMsChange(clampAutosaveMs(n * 1000));
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-[200] p-3 space-y-3"
    >
      <p className="text-xs font-semibold text-gray-700">Cài đặt editor</p>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs text-gray-600">Tự động lưu</p>
          <button
            type="button"
            role="switch"
            aria-checked={autosaveEnabled}
            onClick={() => onAutosaveEnabledChange(!autosaveEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              autosaveEnabled ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                autosaveEnabled ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 leading-snug">
          {autosaveEnabled
            ? `Lưu mỗi ${formatAutosaveInterval(autosaveMs)} khi có thay đổi`
            : "Tắt — chỉ lưu khi bấm nút Lưu hoặc Ctrl+S"}
        </p>
        {autosaveEnabled && (
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <span className="shrink-0">Mỗi</span>
              <input
                type="number"
                min={minSec}
                max={maxSec}
                step={1}
                value={autosaveSec}
                onChange={(e) => handleAutosaveSec(e.target.value)}
                className="w-16 rounded border border-gray-200 px-2 py-1 text-center text-xs text-gray-700 outline-none focus:border-indigo-400"
              />
              <span>giây</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {EDITOR_AUTOSAVE_INTERVAL_PRESETS_SEC.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onAutosaveMsChange(sec * 1000)}
                  className={`rounded-md px-2 py-0.5 text-[10px] border transition-colors ${
                    autosaveSec === sec
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}p`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-3">
        <p className="text-xs font-semibold text-gray-700">Giao diện</p>
        <div>
          <p className="text-xs text-gray-400 mb-1">Chủ đề</p>
          <div className="flex gap-1">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTheme(t)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                  theme === t
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t === "light" ? "☀ Sáng" : "🌙 Tối"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Ngôn ngữ</p>
          <div className="flex gap-1">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleLang(l)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                  lang === l
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {l === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorHeader({
  onSave,
  onPublish,
  onQuickBuild,
  backHref = "/dashboard/cai-dat-thiep",
  title = "Trình chỉnh sửa thiệp",
  saving = false,
  saveStatus = "idle",
  dirtyRef,
  previewHref,
}: EditorHeaderProps) {
  const { canUndo, canRedo, actions, query } = useEditor((state, q) => ({
    canUndo: q.history.canUndo(),
    canRedo: q.history.canRedo(),
  }));

  const FRAME_STORAGE_KEY = "mehappy_copied_image_frame";

  const readCopiedFrame = async (): Promise<Record<string, unknown> | null> => {
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = "";
      }
      if (!text) text = localStorage.getItem(FRAME_STORAGE_KEY) ?? "";
      if (!text) return null;
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const handlePasteGlobal = async () => {
    const frame = await readCopiedFrame();
    if (!frame) return;
    const pasteProps = { ...(frame as Record<string, unknown>) };
    delete (pasteProps as any).elementId;
    if ((pasteProps as any).objectFit === "fill") (pasteProps as any).objectFit = "cover";

    try {
      // find first Section node under ROOT if available
      const root = query.node("ROOT").get();
      const rootNodes = (root.data.nodes ?? []) as string[];
      let targetParent: string = "ROOT";
      for (const nid of rootNodes) {
        try {
          const n = query.node(nid).get();
          const type = n.data.type;
          const display = n.data.displayName as string | undefined;
          const resolved = type && typeof type === "object" && "resolvedName" in type ? (type as any).resolvedName : typeof type === "function" ? (type as any).name : undefined;
          if (resolved === "SectionBlock" || display === "Section") {
            targetParent = nid;
            break;
          }
        } catch {
          /* ignore */
        }
      }

      const tree = query
        .parseReactElement(
          <Element is={ImageBlock} {...pasteProps} elementId={generateElementId()} />
        )
        .toNodeTree();

      actions.addNodeTree(tree, targetParent);
    } catch {
      // ignore
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSavedLabel, setLastSavedLabel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [autosaveMs, setAutosaveMs] = useState(EDITOR_AUTOSAVE_MS_DEFAULT);
  const { viewportWidth } = useEditorUI();

  useEffect(() => {
    setAutosaveEnabled(readStoredAutosaveEnabled());
    setAutosaveMs(readStoredAutosaveMs());
  }, []);

  const setAutosaveEnabledPersist = useCallback((enabled: boolean) => {
    setAutosaveEnabled(enabled);
    writeStoredAutosaveEnabled(enabled);
  }, []);

  const setAutosaveMsPersist = useCallback((ms: number) => {
    const next = clampAutosaveMs(ms);
    setAutosaveMs(next);
    writeStoredAutosaveMs(next);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      flushPendingEditorEdits();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const json = query.serialize();
      const ok = await onSave(json);
      if (ok) {
        setLastSavedAt(new Date());
        if (dirtyRef) dirtyRef.current = false;
      }
    } finally {
      setIsSaving(false);
    }
  }, [query, onSave, dirtyRef]);

  useEffect(() => {
    if (!autosaveEnabled || !autosaveMs) return;
    const interval = setInterval(() => {
      if (!dirtyRef?.current || isSaving || saving) return;
      void handleSave();
    }, autosaveMs);
    return () => clearInterval(interval);
  }, [autosaveEnabled, autosaveMs, isSaving, saving, dirtyRef, handleSave]);

  useEffect(() => {
    if (saveStatus === "saved") setLastSavedAt(new Date());
  }, [saveStatus]);

  useEffect(() => {
    if (!lastSavedAt) return;
    const update = () => {
      const sec = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
      if (sec < 5) setLastSavedLabel("Đã lưu vừa xong");
      else if (sec < 60) setLastSavedLabel(`Đã lưu ${sec}s trước`);
      else setLastSavedLabel(`Đã lưu ${Math.floor(sec / 60)} phút trước`);
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        actions.history.undo();
      }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        actions.history.redo();
      }
      if (e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, handleSave]);

  return (
    <header className="flex items-center justify-between px-4 py-0 bg-white border-b border-gray-200 shadow-sm z-50 shrink-0 h-14 gap-2 text-sm">
      {/* Left: back + title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href={backHref}
          title="Quay lại"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden md:inline text-sm">Quay lại</span>
        </Link>
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        <span className="text-sm font-medium text-gray-700 truncate hidden lg:inline max-w-[180px]">
          {title}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={2} />
            <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
          </svg>
          {viewportWidth}px
          {viewportWidth !== PUBLISHED_CANVAS_WIDTH && (
            <span className="text-gray-400" title="Thiệp công khai luôn 390px">
              / {PUBLISHED_CANVAS_WIDTH}
            </span>
          )}
        </span>
      </div>

      {/* Center: quick-build (phase 2) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onQuickBuild}
          title={onQuickBuild ? "Làm thiệp nhanh" : "Sắp ra mắt"}
          disabled={!onQuickBuild}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="hidden sm:inline">Làm nhanh</span>
        </button>
      </div>

      {/* Right: undo/redo + save + preview + settings */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => actions.history.undo()}
          disabled={!canUndo}
          title="Hoàn tác (Ctrl+Z)"
          className="p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => actions.history.redo()}
          disabled={!canRedo}
          title="Làm lại (Ctrl+Y)"
          className="p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        {lastSavedLabel && (
          <span className="text-xs text-gray-500 hidden xl:inline mr-1">{lastSavedLabel}</span>
        )}

        {previewHref && (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Xem trước thiệp"
            className="p-2 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
        )}

        <button
          type="button"
          onClick={() => setAutosaveEnabledPersist(!autosaveEnabled)}
          title={
            autosaveEnabled
              ? `Tự động lưu: Bật (mỗi ${formatAutosaveInterval(autosaveMs)}) — bấm để tắt`
              : "Tự động lưu: Tắt — bấm để bật"
          }
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            autosaveEnabled
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              : "text-gray-500 border border-transparent hover:bg-gray-100 hover:text-gray-700"
          }`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Tự lưu</span>
          {autosaveEnabled ? (
            <span className="hidden md:inline opacity-90">{formatAutosaveInterval(autosaveMs)}</span>
          ) : (
            <span className="hidden md:inline text-gray-400">(tắt)</span>
          )}
        </button>
        <button
          type="button"
          onClick={handlePasteGlobal}
          title="Paste khung ảnh vào canvas"
          className="p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3 7-7" />
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || saving}
          title="Lưu (Ctrl+S)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving || saving ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          <span>{isSaving || saving ? "Đang lưu..." : "Lưu"}</span>
        </button>

        {onPublish && (
          <button
            type="button"
            onClick={onPublish}
            title="Xuất bản thiệp"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="hidden sm:inline">Xuất bản</span>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            title="Cài đặt"
            className={`p-2 rounded transition-colors ${
              showSettings
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {showSettings && (
            <SettingsPopover
              onClose={() => setShowSettings(false)}
              autosaveEnabled={autosaveEnabled}
              autosaveMs={autosaveMs}
              onAutosaveEnabledChange={setAutosaveEnabledPersist}
              onAutosaveMsChange={setAutosaveMsPersist}
            />
          )}
        </div>
      </div>
    </header>
  );
}
