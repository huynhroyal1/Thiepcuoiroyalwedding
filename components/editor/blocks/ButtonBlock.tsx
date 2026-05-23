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
import { useCraftViewerMode } from "../hooks/useCraftViewerMode";

export interface ButtonBlockProps extends SharedProps {
  label?: string;
  url?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | "600";
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge";
  borderWidth?: number;
  borderColor?: string;
}

export function ButtonBlock({
  label = "Xem chỉ đường",
  url = "#",
  bgColor = "#ea6c88",
  textColor = "#ffffff",
  fontSize = 16,
  borderRadius = 8,
  paddingX = 24,
  paddingY = 10,
  top = 0,
  left = 0,
  width = 260,
  height,
  fontFamily = "inherit",
  fontWeight = "normal",
  borderStyle = "none",
  borderWidth = 0,
  borderColor = "transparent",
  ...sharedProps
}: ButtonBlockProps) {
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

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    top,
    ...blockLayout(isViewer, left, width),
    height,
    outline: selected ? "2px solid #6366f1" : "none",
    cursor: selected ? "move" : "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...buildSharedStyle(sharedProps),
  };

  const btnStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: bgColor,
    color: textColor,
    fontSize,
    fontWeight,
    borderRadius,
    padding: `${paddingY}px ${paddingX}px`,
    border: borderStyle !== "none" ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
    cursor: "pointer",
    fontFamily,
    textDecoration: "none",
    height: height ? "100%" : undefined,
    boxSizing: "border-box",
  };

  return (
    <div
      ref={connectRef}
      id={domId}
      style={wrapperStyle}
      data-block="button"
      data-node-id={id}
      data-events={eventsAttr}
      {...animAttrs}
      {...extraAttrs}
      data-custom-class={sharedProps.customClass || undefined}
    >
      <a
        href={url}
        style={btnStyle}
        onClick={(e) => e.preventDefault()}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
    </div>
  );
}

ButtonBlock.craft = {
  displayName: "Nút bấm",
  props: {
    label: "Xem chỉ đường",
    url: "#",
    bgColor: "#ea6c88",
    textColor: "#ffffff",
    fontSize: 16,
    borderRadius: 8,
    paddingX: 24,
    paddingY: 10,
    top: 0,
    left: 0,
    width: 260,
    height: undefined,
    fontFamily: "inherit",
    fontWeight: "normal",
    borderStyle: "none",
    borderWidth: 0,
    borderColor: "transparent",
    ...SHARED_DEFAULTS,
  },
  rules: {
    canDrag: () => false,
  },
};
