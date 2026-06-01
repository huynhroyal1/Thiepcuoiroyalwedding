"use client";

import React from "react";

export interface WishesBlockProps {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  opacity?: number;
}

/**
 * WishesBlock is a placeholder in the editor.
 * The actual WishesSection is rendered outside of Craft.js in InvitationRenderer
 * to ensure forms work correctly without Craft.js event interference.
 */
export function WishesBlock() {
  return (
    <div
      style={{
        width: "100%",
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fef3f3 0%, #fce7f3 100%)",
        border: "2px dashed #fda4af",
        borderRadius: 12,
        color: "#be185d",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
        Sổ lưu bút & Xác nhận
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
          (Hiển thị ở cuối trang thiệp)
        </div>
      </div>
    </div>
  );
}

WishesBlock.craft = {
  displayName: "Sổ lưu bút & Xác nhận",
  props: {
    top: 0,
    left: 0,
    width: 390,
    height: 200,
    opacity: 100,
  },
  rules: {
    canDrag: () => false,
  },
};
