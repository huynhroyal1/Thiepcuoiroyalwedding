"use client";

import React, { CSSProperties } from "react";
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
import { buildFilterString, type FilterProps } from "@/lib/cssFilter";
import { useCraftViewerMode } from "../hooks/useCraftViewerMode";

export interface ImageBlockProps extends SharedProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  borderRadius?: number;
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge";
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  top?: number;
  left?: number;
  imageFade?: boolean;
  imageFadeDirection?: "bottom" | "top" | "left" | "right";
  // Per-image filter (applied to <img> element only)
  imageFilter?: FilterProps;
  imageBlendMode?: string;
  imageTransform?: string;
  imageTransformOrigin?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

export function ImageBlock({
  src = "",
  alt = "",
  width = 300,
  height = 200,
  objectFit = "cover",
  borderRadius = 0,
  borderStyle = "none",
  borderWidth = 1,
  borderColor = "#cccccc",
  opacity = 100,
  top = 0,
  left = 0,
  imageFade = false,
  imageFadeDirection = "bottom",
  imageFilter,
  imageBlendMode = "normal",
  imageTransform = "",
  imageTransformOrigin = "center center",
  overlayColor = "#000000",
  overlayOpacity = 0,
  ...sharedProps
}: ImageBlockProps) {
  const { id, selected } = useNode((state) => ({
    id: state.id,
    selected: state.events.selected,
  }));
  const connectRef = useBlockConnect();
  const domId = sharedProps.elementId || undefined;
  const isViewer = useCraftViewerMode();

  const animAttrs = buildAnimationAttrs(sharedProps);
  const extraAttrs = buildExtraAttrs(sharedProps);
  const eventsAttr = buildEventsAttr(sharedProps);

  const borderVal =
    borderStyle !== "none"
      ? `${borderWidth}px ${borderStyle} ${borderColor}`
      : "none";

  const fadeGradient: Record<string, string> = {
    bottom: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)",
    top: "linear-gradient(to top, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)",
    left: "linear-gradient(to left, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)",
    right: "linear-gradient(to right, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)",
  };

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    top,
    ...blockLayout(isViewer, left, width),
    height,
    borderRadius,
    border: borderVal,
    overflow: "hidden",
    opacity: opacity / 100,
    outline: selected ? "2px solid #6366f1" : "none",
    cursor: selected ? "move" : "default",
    boxSizing: "border-box",
    ...buildSharedStyle(sharedProps),
  };

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    objectFit,
    display: "block",
    filter: imageFilter ? buildFilterString(imageFilter) : undefined,
    mixBlendMode: imageBlendMode as CSSProperties["mixBlendMode"],
    transform: imageTransform || undefined,
    transformOrigin: imageTransformOrigin,
  };

  return (
    <div
      ref={connectRef}
      id={domId}
      style={wrapperStyle}
      data-block="image"
      data-node-id={id}
      data-events={eventsAttr}
      {...animAttrs}
      {...extraAttrs}
      data-custom-class={sharedProps.customClass || undefined}
    >
      {src ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={imgStyle} />
          {imageFade && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: fadeGradient[imageFadeDirection],
                pointerEvents: "none",
              }}
            />
          )}
          {overlayOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: overlayColor,
                opacity: overlayOpacity / 100,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          Chọn ảnh
        </div>
      )}
    </div>
  );
}

ImageBlock.craft = {
  displayName: "Hình ảnh",
  props: {
    src: "",
    alt: "",
    width: 300,
    height: 200,
    objectFit: "cover",
    borderRadius: 0,
    borderStyle: "none",
    borderWidth: 1,
    borderColor: "#cccccc",
    opacity: 100,
    top: 0,
    left: 0,
    imageFade: false,
    imageFadeDirection: "bottom",
    imageFilter: undefined,
    imageBlendMode: "normal",
    imageTransform: "",
    imageTransformOrigin: "center center",
    overlayColor: "#000000",
    overlayOpacity: 0,
    ...SHARED_DEFAULTS,
  },
  rules: {
    canDrag: () => false,
  },
};
