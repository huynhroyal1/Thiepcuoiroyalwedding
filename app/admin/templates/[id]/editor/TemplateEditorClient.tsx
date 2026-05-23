"use client";

import "animate.css";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Editor, Element } from "@craftjs/core";
import { editorResolver } from "@/components/editor/resolver";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { LeftSidebar } from "@/components/editor/panels/LeftSidebar";
import { FloatingPropertyPanel } from "@/components/editor/panels/FloatingPropertyPanel";
import { EditorUIProvider } from "@/components/editor/EditorUIContext";
import { QuickBuildWizard } from "@/components/editor/QuickBuildWizard";
import { EditorCanvasArea } from "@/components/editor/canvas/EditorCanvasArea";
import { SectionBlock } from "@/components/editor/blocks/SectionBlock";
import { TextBlock } from "@/components/editor/blocks/TextBlock";
import { RootCanvas } from "@/components/editor/blocks/RootCanvas";
import { EditorCardProvider } from "@/components/editor/EditorContext";
import { generateElementId } from "@/components/editor/utils/elementId";
import { saveTemplateContentJson } from "@/app/actions/admin";
import { migrateContentJson } from "@/lib/editor/migrateContentJson";
import { canOpenVisualEditor, getContentJsonKind } from "@/lib/editor/contentJsonKind";
import { templatePreviewHrefWithVersion } from "@/lib/marketing/template-preview-url";
import { RawHtmlTemplateEditor } from "./RawHtmlTemplateEditor";
import type { Plan, TemplateRow, WeddingCard } from "@/types";

const MOBILE_WIDTH = 390;

function buildPlaceholderCard(template: TemplateRow): WeddingCard {
  const plan = (template.plan_required ?? "basic") as Plan;
  const weddingDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: "template-preview",
    user_id: "",
    slug: "template-preview",
    plan,
    status: "draft",
    bride_name: "Cẩm Linh",
    bride_parents: null,
    groom_name: "Minh Quang",
    groom_parents: null,
    wedding_date: weddingDate,
    ceremony_time: "09:00",
    reception_time: "18:00",
    venue_name: "Nhà hàng Tiệc cưới Hoàng Gia",
    venue_address: "123 Đường Hoa, Quận 1, TP. Hồ Chí Minh",
    venue_maps_url: null,
    love_story: null,
    hashtag: null,
    background_music_url: null,
    cover_image_url: template.thumbnail_url,
    template_id: template.id,
    primary_color: "#ea6c88",
    font_family: "'Playfair Display', serif",
    confetti_effect: "none",
    paid_at: new Date().toISOString(),
    payment_order_id: null,
    show_gift_box: true,
    gift_bank_name: "Vietcombank",
    gift_account_number: "0123456789",
    gift_account_name: "NGUYEN VAN A",
    gift_qr_url: null,
    remove_branding: false,
    custom_domain: null,
    view_count: 0,
    show_in_showcase: false,
    content_json: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function resolveTemplatePreviewHref(template: TemplateRow, version: number): string {
  return templatePreviewHrefWithVersion(template, version);
}

export function TemplateEditorClient({ template }: { template: TemplateRow }) {
  const [editorCard, setEditorCard] = useState(() => buildPlaceholderCard(template));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const dirtyRef = useRef(false);

  const contentKind = getContentJsonKind(template.content_json);
  const hasCraftContent = canOpenVisualEditor(template.content_json);
  const hasInvalidContent = !!template.content_json && contentKind === "none";

  const initialFrameData = useMemo(
    () =>
      hasCraftContent
        ? JSON.stringify(migrateContentJson(template.content_json as Record<string, unknown>))
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template.id],
  );

  const patchCard = useCallback(
    (patch: Partial<WeddingCard>) => setEditorCard((prev) => ({ ...prev, ...patch })),
    [],
  );

  const handleSave = async (json: string): Promise<boolean> => {
    setSaveStatus("saving");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(json) as Record<string, unknown>;
    } catch {
      setSaveError("Dữ liệu mẫu không hợp lệ");
      setSaveStatus("error");
      return false;
    }

    try {
      const result = await saveTemplateContentJson(template.id, parsed);
      if (result.error) {
        setSaveError(result.error);
        setSaveStatus("error");
        return false;
      }
      setSaveError(null);
      setSaveStatus("saved");
      setPreviewVersion((v) => v + 1);
      if (result.savedAt) {
        setEditorCard((prev) => ({ ...prev, updated_at: result.savedAt! }));
      }
      dirtyRef.current = false;
      setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Lỗi không xác định");
      setSaveStatus("error");
      return false;
    }
  };

  if (contentKind === "raw-html") {
    return <RawHtmlTemplateEditor template={template} />;
  }

  return (
    <EditorCardProvider
      card={editorCard}
      patchCard={patchCard}
      uploadScopeId={`templates/${template.id}`}
    >
      <Editor
        resolver={editorResolver}
        enabled
        onNodesChange={() => {
          dirtyRef.current = true;
        }}
      >
        <EditorUIProvider>
          <div className="flex h-full min-h-0 flex-col">
            <EditorHeader
              title={`Mẫu: ${template.name}`}
              backHref="/admin/templates"
              onSave={handleSave}
              saving={saveStatus === "saving"}
              saveStatus={saveStatus}
              dirtyRef={dirtyRef}
              onQuickBuild={() => setShowWizard(true)}
              previewHref={resolveTemplatePreviewHref(template, previewVersion)}
            />

            <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-950 sm:text-sm">
              Chỉnh <strong>mẫu gốc</strong> — khách chọn mẫu mới nhận bản thiết kế này; thiệp cũ của khách{" "}
              <strong>không tự cập nhật</strong>.
            </div>

            {hasInvalidContent && (
              <div className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-900 sm:text-sm">
                Dữ liệu mẫu không hợp lệ — đang mở canvas trống. Lưu lại sẽ ghi đè nội dung cũ.
              </div>
            )}

            {showWizard && <QuickBuildWizard onClose={() => setShowWizard(false)} />}

            {saveStatus === "saved" && (
              <div className="absolute top-16 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
                ✓ Đã lưu mẫu — khách chọn mẫu mới sẽ dùng phiên bản này
              </div>
            )}
            {saveStatus === "error" && (
              <div className="absolute top-16 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-center text-sm text-white shadow-lg">
                ✕ Lưu thất bại{saveError ? `: ${saveError}` : ""}
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar />

              <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                <EditorCanvasArea frameKey={template.id} frameData={initialFrameData}>
                  {!hasCraftContent && (
                    <Element is={RootCanvas} canvas>
                      <Element
                        is={SectionBlock}
                        canvas
                        height={600}
                        bgType="color"
                        bgColor="#fdf6f0"
                        elementId={generateElementId()}
                      >
                        <TextBlock
                          content="Trân trọng kính mời"
                          fontSize={16}
                          color="#999999"
                          textAlign="center"
                          top={60}
                          left={20}
                          width={MOBILE_WIDTH - 40}
                          elementId={generateElementId()}
                        />
                        <TextBlock
                          content="Tên cô dâu & Tên chú rể"
                          fontSize={30}
                          fontFamily="'Playfair Display', serif"
                          color="#8b5e52"
                          textAlign="center"
                          top={100}
                          left={20}
                          width={MOBILE_WIDTH - 40}
                          elementId={generateElementId()}
                        />
                      </Element>
                    </Element>
                  )}
                </EditorCanvasArea>
                <FloatingPropertyPanel />
              </div>
            </div>
          </div>
        </EditorUIProvider>
      </Editor>
    </EditorCardProvider>
  );
}
