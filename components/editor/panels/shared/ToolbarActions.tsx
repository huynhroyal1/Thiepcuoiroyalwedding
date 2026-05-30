"use client";

import React, { useEffect, useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import { generateElementId } from "../../utils/elementId";
import type { SharedProps } from "../../utils/styleHelpers";
import { useEditorUI } from "../../EditorUIContext";
import { canDeleteNode, safeDeleteNode } from "@/lib/editor/safeDeleteNode";
import { ImageBlock } from "../../blocks/ImageBlock";

const STYLE_STORAGE_KEY = "craft-copied-style";

interface ToolbarActionsProps {
  selectedId: string;
  compact?: boolean;
}

export function ToolbarActions({ selectedId, compact = false }: ToolbarActionsProps) {
  const { actions, query } = useEditor();
  const { openSaveTemplate } = useEditorUI();
  const [hasCopiedStyle, setHasCopiedStyle] = useState(false);
  const [hasCopiedFrame, setHasCopiedFrame] = useState(false);

  const FRAME_STORAGE_KEY = "mehappy_copied_image_frame";

  useEffect(() => {
    setHasCopiedStyle(!!sessionStorage.getItem(STYLE_STORAGE_KEY));
    setHasCopiedFrame(!!localStorage.getItem(FRAME_STORAGE_KEY));
  }, []);

  const node = query.node(selectedId).get();
  const parentId = node?.data.parent;

  const handleHide = () => {
    const currentHidden = (node?.data.props as Record<string, unknown>)?.hidden as boolean;
    actions.setProp(selectedId, (p: Record<string, unknown>) => {
      p.hidden = !currentHidden;
    });
  };

  const handleLock = () => {
    const currentLocked = (node?.data.props as Record<string, unknown>)?.locked as boolean;
    actions.setProp(selectedId, (p: Record<string, unknown>) => {
      p.locked = !currentLocked;
    });
  };

  const handleBringForward = () => {
    const currentZ = ((node?.data.props as Record<string, unknown>)?.zIndex as number) ?? 0;
    actions.setProp(selectedId, (p: Record<string, unknown>) => {
      p.zIndex = currentZ + 1;
    });
  };

  const handleSendBackward = () => {
    const currentZ = ((node?.data.props as Record<string, unknown>)?.zIndex as number) ?? 0;
    actions.setProp(selectedId, (p: Record<string, unknown>) => {
      p.zIndex = Math.max(0, currentZ - 1);
    });
  };

  const handleDuplicate = () => {
    if (!parentId) return;
    try {
      const nodeTree = query.node(selectedId).toNodeTree();
      const assignNewElementIds = (tree: typeof nodeTree) => {
        Object.values(tree.nodes).forEach((raw) => {
          const node = raw as { data?: { props?: Record<string, unknown> } };
          const props = node.data?.props;
          if (props && "elementId" in props && node.data) {
            node.data.props = { ...props, elementId: generateElementId() };
          }
        });
      };
      assignNewElementIds(nodeTree);
      actions.addNodeTree(nodeTree, parentId);
    } catch {
      // Silently fail if duplicate not supported
    }
  };

  const handleDelete = () => {
    safeDeleteNode(actions, query, selectedId);
  };

  const deleteAllowed = canDeleteNode(query, selectedId);

  const handleCopyStyle = () => {
    const props = node?.data.props as Partial<SharedProps> | undefined;
    if (!props) return;
    const style: Partial<SharedProps> = {
      blendMode: props.blendMode, filterContrast: props.filterContrast,
      filterBrightness: props.filterBrightness, filterSaturate: props.filterSaturate,
      filterGrayscale: props.filterGrayscale, filterOpacity: props.filterOpacity,
      filterInvert: props.filterInvert, filterSepia: props.filterSepia,
      filterHueRotate: props.filterHueRotate, shadowType: props.shadowType,
      shadowX: props.shadowX, shadowY: props.shadowY, shadowBlur: props.shadowBlur,
      shadowOpacity: props.shadowOpacity, shadowColor: props.shadowColor,
      rotateX: props.rotateX, rotateY: props.rotateY, rotateZ: props.rotateZ,
      skewX: props.skewX, skewY: props.skewY, perspective: props.perspective,
      hoverEffect: props.hoverEffect,
    };
    sessionStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(style));
    setHasCopiedStyle(true);
  };

  const handlePasteStyle = () => {
    const raw = sessionStorage.getItem(STYLE_STORAGE_KEY);
    if (!raw) return;
    try {
      const style = JSON.parse(raw) as Partial<SharedProps>;
      actions.setProp(selectedId, (p: Record<string, unknown>) => {
        Object.entries(style).forEach(([k, v]) => { if (v !== undefined) p[k] = v; });
      });
    } catch { /* ignore */ }
  };

  const readCopiedFrame = async (): Promise<Record<string, unknown> | null> => {
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = "";
      }
      if (!text) {
        text = localStorage.getItem(FRAME_STORAGE_KEY) ?? "";
      }
      if (!text) return null;
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const handleCopyFrame = async () => {
    try {
      const props = node?.data.props as Record<string, unknown> | undefined;
      if (!props || (node?.data.displayName as string | undefined) !== "Hình ảnh") return;
      const frame = { ...props };
      delete frame.elementId;
      const json = JSON.stringify(frame);
      try {
        await navigator.clipboard.writeText(json);
      } catch {
        // ignore permission issues
      }
      try {
        localStorage.setItem(FRAME_STORAGE_KEY, json);
      } catch {
        // ignore storage issues
      }
      setHasCopiedFrame(true);
    } catch {
      // ignore
    }
  };

  const handlePasteFrame = async () => {
    const frame = await readCopiedFrame();
    if (!frame) return;
    const pasteProps = { ...frame };
    delete pasteProps.elementId;
    if (pasteProps.objectFit === "fill") {
      pasteProps.objectFit = "cover";
    }

    const selectedNode = query.node(selectedId).get();
    const resolvedName = (() => {
      const type = selectedNode?.data?.type;
      if (type && typeof type === "object" && "resolvedName" in type) {
        return (type as { resolvedName?: string }).resolvedName;
      }
      if (typeof type === "function") return type.name;
      return selectedNode?.data?.name as string | undefined;
    })();
    const isContainer = resolvedName === "RootCanvas" || resolvedName === "SectionBlock" || selectedNode?.data.displayName === "Section" || selectedNode?.data.displayName === "Canvas";

    try {
      const tree = query
        .parseReactElement(
          <Element is={ImageBlock} {...pasteProps} elementId={generateElementId()} />
        )
        .toNodeTree();

      if (isContainer) {
        actions.addNodeTree(tree, selectedId);
      } else if (parentId) {
        const siblings = (query.node(parentId).get().data.nodes ?? []) as string[];
        const idx = siblings.indexOf(selectedId);
        actions.addNodeTree(tree, parentId, idx >= 0 ? idx + 1 : undefined);
      } else {
        actions.addNodeTree(tree, "ROOT");
      }
    } catch {
      // ignore invalid paste target
    }
  };

  const isHidden = !!(node?.data.props as Record<string, unknown>)?.hidden;
  const isLocked = !!(node?.data.props as Record<string, unknown>)?.locked;
  const currentZ = ((node?.data.props as Record<string, unknown>)?.zIndex as number) ?? 0;

  return (
    <div
      className={`flex items-center gap-1 ${
        compact ? "p-1" : "p-2 border-b border-gray-100 bg-gray-50"
      }`}
    >
      <button
        onClick={handleHide}
        title={isHidden ? "Hiện" : "Ẩn"}
        className={`p-1.5 rounded text-xs transition-colors ${
          isHidden ? "bg-indigo-100 text-indigo-600" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {isHidden ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        )}
      </button>

      <button
        onClick={handleLock}
        title={isLocked ? "Mở khoá" : "Khoá"}
        className={`p-1.5 rounded text-xs transition-colors ${
          isLocked ? "bg-amber-100 text-amber-600" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {isLocked ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button
        onClick={handleBringForward}
        title={`Lên trước (z: ${currentZ})`}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <button
        onClick={handleSendBackward}
        title={`Xuống sau (z: ${currentZ})`}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button
        onClick={handleDuplicate}
        title="Nhân bản"
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      <button
        onClick={handleCopyFrame}
        title="Copy khung ảnh"
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2M8 7H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3" />
        </svg>
      </button>

      {hasCopiedFrame && (
        <button
          onClick={handlePasteFrame}
          title="Paste khung ảnh"
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2M8 7H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l3 3 5-5" />
          </svg>
        </button>
      )}

      <button
        onClick={handleCopyStyle}
        title="Sao chép style"
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      </button>

      {hasCopiedStyle && (
        <button
          onClick={handlePasteStyle}
          title="Dán style"
          className="p-1.5 rounded text-indigo-500 hover:bg-indigo-50 text-xs transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={openSaveTemplate}
        title="Lưu mẫu"
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!deleteAllowed}
        title={deleteAllowed ? "Xoá phần tử" : "Không thể xoá phần tử này"}
        className="p-1.5 rounded text-red-400 hover:bg-red-50 text-xs transition-colors ml-auto disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
