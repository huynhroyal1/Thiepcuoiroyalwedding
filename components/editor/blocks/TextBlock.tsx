"use client";

import React, { useRef, useEffect, useState, CSSProperties } from "react";
import { useNode } from "@craftjs/core";
import { useBlockConnect } from "../hooks/useBlockConnect";
import { blockLayout } from "@/lib/editor/viewerLayout";
import {
  SharedProps,
  SHARED_DEFAULTS,
  buildSharedStyle,
  buildAnimationAttrs,
  buildEventsAttr,
  buildExtraAttrs,
} from "../utils/styleHelpers";
import { cardFieldPatchFromPlain, type CardTextField } from "@/lib/editor/cardFieldBinding";
import { useEditorCardPatch } from "../EditorContext";
import { useCraftViewerMode } from "../hooks/useCraftViewerMode";

export interface TextBlockProps extends SharedProps {
  /** When set, values sync to wedding_cards on save (date, names, venue). */
  cardField?: CardTextField;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  colorType?: "solid" | "gradient";
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold" | "600";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  lineHeight?: number;
  letterSpacing?: number;
  textShadow?: boolean;
  textShadowColor?: string;
  textShadowX?: number;
  textShadowY?: number;
  textShadowBlur?: number;
  textStroke?: boolean;
  textStrokeWidth?: number;
  textStrokeColor?: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge";
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
}

function plainTextFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function TextBlock({
  cardField,
  content = "Nhập văn bản...",
  fontSize = 24,
  fontFamily = "serif",
  color = "#333333",
  colorType = "solid",
  gradientFrom = "#ea6c88",
  gradientTo = "#f5a623",
  gradientAngle = 90,
  textAlign = "center",
  fontWeight = "normal",
  fontStyle = "normal",
  textDecoration = "none",
  textTransform = "none",
  lineHeight = 1.4,
  letterSpacing = 0,
  textShadow = false,
  textShadowColor = "#000000",
  textShadowX = 2,
  textShadowY = 2,
  textShadowBlur = 4,
  textStroke = false,
  textStrokeWidth = 1,
  textStrokeColor = "#000000",
  top = 0,
  left = 0,
  width = 300,
  height,
  backgroundColor = "transparent",
  borderStyle = "none",
  borderWidth = 0,
  borderColor = "transparent",
  borderRadius = 0,
  paddingX = 8,
  paddingY = 2,
  ...sharedProps
}: TextBlockProps) {
  const {
    id,
    actions: { setProp },
    selected,
  } = useNode((state) => ({
    id: state.id,
    selected: state.events.selected,
  }));

  const connectRef = useBlockConnect();
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const patchCard = useEditorCardPatch();
  const isViewer = useCraftViewerMode();

  // Saved Craft JSON is the source of truth for invitation + editor reload.
  const displayContent = content;

  const contentRef = useRef(displayContent);
  contentRef.current = displayContent;

  const commitContent = () => {
    const html = spanRef.current?.innerHTML ?? "";
    const plain = plainTextFromHtml(html);
    setProp((p: TextBlockProps) => {
      p.content = plain === "" ? contentRef.current : html;
    });
    if (cardField && patchCard) {
      const patch = cardFieldPatchFromPlain(cardField, plain || plainTextFromHtml(contentRef.current));
      if (patch) patchCard(patch);
    }
  };

  useEffect(() => {
    if (selected) return;
    if (isEditing) commitContent();
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when selection clears
  }, [selected]);

  const animAttrs = buildAnimationAttrs(sharedProps);
  const extraAttrs = buildExtraAttrs(sharedProps);
  const eventsAttr = buildEventsAttr(sharedProps);
  const domId = sharedProps.elementId || undefined;

  const textShadowStr = textShadow
    ? `${textShadowX}px ${textShadowY}px ${textShadowBlur}px ${textShadowColor}`
    : undefined;

  const textStrokeStr = textStroke
    ? `${textStrokeWidth}px ${textStrokeColor}`
    : undefined;

  const gradientStyle: CSSProperties =
    colorType === "gradient"
      ? {
          backgroundImage: `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }
      : {
          WebkitTextFillColor: color,
        };

  const style: CSSProperties = {
    position: "absolute",
    top,
    ...blockLayout(isViewer, left, width),
    height,
    fontSize,
    fontFamily,
    color: colorType === "solid" ? color : undefined,
    backgroundColor,
    textAlign,
    fontWeight,
    fontStyle,
    textDecoration,
    textTransform,
    lineHeight,
    letterSpacing,
    textShadow: textShadowStr,
    WebkitTextStroke: textStrokeStr,
    outline: selected ? "1px dashed #6366f1" : "none",
    cursor: isEditing ? "text" : selected ? "move" : "default",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    boxSizing: "border-box",
    border: borderStyle !== "none" ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
    borderRadius,
    padding: `${paddingY}px ${paddingX}px`,
    ...gradientStyle,
    ...buildSharedStyle(sharedProps),
  };

  useEffect(() => {
    if (!spanRef.current || isEditing) return;
    if (spanRef.current.innerHTML !== displayContent) {
      spanRef.current.innerHTML = displayContent;
    }
  }, [displayContent, isEditing]);

  const startEditing = () => {
    if (!spanRef.current) return;
    setIsEditing(true);
    spanRef.current.innerHTML = contentRef.current;
    spanRef.current.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(spanRef.current);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  return (
    <div
      ref={connectRef}
      id={domId}
      style={style}
      data-block="text"
      data-node-id={id}
      data-events={eventsAttr}
      {...animAttrs}
      {...extraAttrs}
      data-custom-class={sharedProps.customClass || undefined}
    >
      <span
        ref={spanRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEditing();
        }}
        onBlur={() => {
          if (!isEditing) return;
          commitContent();
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            if (spanRef.current) spanRef.current.innerHTML = contentRef.current;
            setIsEditing(false);
            (e.target as HTMLElement).blur();
          }
        }}
        style={{
          outline: "none",
          display: "block",
          width: "100%",
          overflowWrap: "anywhere",
          pointerEvents: isEditing ? "auto" : "none",
          userSelect: isEditing ? "text" : "none",
        }}
        dangerouslySetInnerHTML={isEditing ? undefined : { __html: displayContent }}
      />
    </div>
  );
}

TextBlock.craft = {
  displayName: "Text",
  props: {
    cardField: undefined,
    content: "Văn bản",
    fontSize: 24,
    fontFamily: "serif",
    color: "#333333",
    colorType: "solid",
    gradientFrom: "#ea6c88",
    gradientTo: "#f5a623",
    gradientAngle: 90,
    textAlign: "center",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "none",
    lineHeight: 1.4,
    letterSpacing: 0,
    textShadow: false,
    textShadowColor: "#000000",
    textShadowX: 2,
    textShadowY: 2,
    textShadowBlur: 4,
    textStroke: false,
    textStrokeWidth: 1,
    textStrokeColor: "#000000",
    top: 0,
    left: 0,
    width: 300,
    height: undefined,
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    paddingX: 8,
    paddingY: 2,
    ...SHARED_DEFAULTS,
  },
  rules: {
    canDrag: () => false,
  },
};
