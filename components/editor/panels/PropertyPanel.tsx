"use client";

import React, { useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import { FilterPanel } from "./shared/FilterPanel";
import { TransformPanel } from "./shared/TransformPanel";
import { BoxShadowPanel } from "./shared/BoxShadowPanel";
import { AnimationPanel } from "./shared/AnimationPanel";
import { EventsPanel } from "./shared/EventsPanel";
import { ToolbarActions } from "./shared/ToolbarActions";
import { ImageUrlInput } from "./shared/ImageUrlInput";
import { ImageBlock } from "../blocks/ImageBlock";
import { generateElementId } from "../utils/elementId";
import { useEditorCard } from "../EditorContext";

// ─── Utility input components ─────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="prop-label shrink-0 w-[5.5rem]">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-7 border border-gray-200 rounded cursor-pointer p-0 shrink-0"
      />
      <TextInput value={value} onChange={onChange} />
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="prop-label">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-indigo-500" : "bg-gray-200"}`}
      >
        <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 prop-section-title font-semibold text-gray-700 hover:bg-gray-50"
      >
        {title}
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ─── Shared constants used by multiple panels ─────────────────────────────────

const BLEND_MODES_LIST = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference",
  "exclusion", "hue", "saturation", "color", "luminosity",
];

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="py-1">
      <div className="flex justify-between mb-0.5">
        <span className="prop-label">{label}</span>
        <span className="text-xs text-gray-400 font-mono">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1 accent-indigo-500" />
    </div>
  );
}

// ─── Per-element panels ────────────────────────────────────────────────────────

const FONTS = [
  { value: "serif", label: "Serif" },
  { value: "sans-serif", label: "Sans-serif" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Great Vibes', cursive", label: "Great Vibes" },
  { value: "'Dancing Script', cursive", label: "Dancing Script" },
  { value: "Quicksand, sans-serif", label: "Quicksand" },
  { value: "Oswald, sans-serif", label: "Oswald" },
  { value: "Montserrat, sans-serif", label: "Montserrat" },
  { value: "Lato, sans-serif", label: "Lato" },
];

function SectionPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  const bgType = (props.bgType as string) ?? "color";
  const overlayType = (props.overlayType as string) ?? "none";
  const separatorType = (props.separatorType as string) ?? "none";

  return (
    <div className="space-y-1">
      <Row label="Chiều cao">
        <NumberInput value={props.height as number} onChange={(v) => setProp((p) => { p.height = v; })} min={100} max={3000} />
      </Row>

      {/* Background */}
      <div className="text-[10px] uppercase tracking-wide text-gray-400 pt-2 pb-0.5">Nền</div>
      <Row label="Loại nền">
        <SelectInput
          value={bgType}
          onChange={(v) => setProp((p) => { p.bgType = v; })}
          options={[
            { value: "color", label: "Màu đơn" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Hình ảnh" },
            { value: "video", label: "Video" },
          ]}
        />
      </Row>
      {bgType === "color" && (
        <Row label="Màu nền">
          <ColorInput value={(props.bgColor as string) ?? "#ffffff"} onChange={(v) => setProp((p) => { p.bgColor = v; })} />
        </Row>
      )}
      {bgType === "gradient" && (
        <>
          <Row label="Màu đầu"><ColorInput value={(props.gradientFrom as string) ?? "#ea6c88"} onChange={(v) => setProp((p) => { p.gradientFrom = v; })} /></Row>
          <Row label="Màu cuối"><ColorInput value={(props.gradientTo as string) ?? "#f5a623"} onChange={(v) => setProp((p) => { p.gradientTo = v; })} /></Row>
          <Row label="Góc (°)"><NumberInput value={(props.gradientAngle as number) ?? 135} onChange={(v) => setProp((p) => { p.gradientAngle = v; })} min={0} max={360} /></Row>
        </>
      )}
      {bgType === "image" && (
        <>
          <Row label="Ảnh nền">
            <ImageUrlInput
              value={(props.bgUrl as string) ?? ""}
              onChange={(v) => setProp((p) => { p.bgUrl = v; })}
            />
          </Row>
          <Row label="Kích thước">
            <SelectInput value={(props.bgSize as string) ?? "cover"} onChange={(v) => setProp((p) => { p.bgSize = v; })} options={[{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }, { value: "auto", label: "Auto" }]} />
          </Row>
          <Row label="Vị trí"><TextInput value={(props.bgPosition as string) ?? "center center"} onChange={(v) => setProp((p) => { p.bgPosition = v; })} placeholder="center center" /></Row>
          <Row label="Lặp lại">
            <SelectInput value={(props.bgRepeat as string) ?? "no-repeat"} onChange={(v) => setProp((p) => { p.bgRepeat = v; })} options={[{ value: "no-repeat", label: "Không lặp" }, { value: "repeat", label: "Lặp cả hai" }, { value: "repeat-x", label: "Lặp ngang" }, { value: "repeat-y", label: "Lặp dọc" }]} />
          </Row>
          <Row label="Dính">
            <SelectInput value={(props.bgAttachment as string) ?? "scroll"} onChange={(v) => setProp((p) => { p.bgAttachment = v; })} options={[{ value: "scroll", label: "Cuộn cùng" }, { value: "fixed", label: "Cố định (Parallax)" }]} />
          </Row>
        </>
      )}
      {bgType === "video" && (
        <>
          <Row label="URL video"><TextInput value={(props.videoUrl as string) ?? ""} onChange={(v) => setProp((p) => { p.videoUrl = v; })} placeholder="https://...mp4" /></Row>
          <Row label="Poster">
            <ImageUrlInput
              value={(props.videoPoster as string) ?? ""}
              onChange={(v) => setProp((p) => { p.videoPoster = v; })}
              placeholder="Ảnh poster video"
            />
          </Row>
        </>
      )}

      {/* Overlay */}
      <div className="text-[10px] uppercase tracking-wide text-gray-400 pt-2 pb-0.5">Lớp phủ</div>
      <Row label="Loại phủ">
        <SelectInput
          value={overlayType}
          onChange={(v) => setProp((p) => { p.overlayType = v; })}
          options={[
            { value: "none", label: "Không có" },
            { value: "color", label: "Màu đơn" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Hình ảnh" },
          ]}
        />
      </Row>
      {overlayType === "color" && (
        <>
          <Row label="Màu phủ"><ColorInput value={(props.overlayColor as string) ?? "#000000"} onChange={(v) => setProp((p) => { p.overlayColor = v; })} /></Row>
          <Row label="Độ mờ (%)"><NumberInput value={(props.overlayOpacity as number) ?? 30} onChange={(v) => setProp((p) => { p.overlayOpacity = v; })} min={0} max={100} /></Row>
        </>
      )}
      {overlayType === "gradient" && (
        <>
          <Row label="Màu đầu"><ColorInput value={(props.overlayGradientFrom as string) ?? "#000000"} onChange={(v) => setProp((p) => { p.overlayGradientFrom = v; })} /></Row>
          <Row label="Màu cuối"><ColorInput value={(props.overlayGradientTo as string) ?? "#000000"} onChange={(v) => setProp((p) => { p.overlayGradientTo = v; })} /></Row>
          <Row label="Góc (°)"><NumberInput value={(props.overlayGradientAngle as number) ?? 135} onChange={(v) => setProp((p) => { p.overlayGradientAngle = v; })} min={0} max={360} /></Row>
        </>
      )}
      {overlayType === "image" && (
        <>
          <Row label="Hình phủ">
            <ImageUrlInput
              value={(props.overlayImageUrl as string) ?? ""}
              onChange={(v) => setProp((p) => { p.overlayImageUrl = v; })}
              placeholder="Pattern / texture"
            />
          </Row>
          <Row label="Lặp">
            <SelectInput value={(props.overlayImageRepeat as string) ?? "repeat"} onChange={(v) => setProp((p) => { p.overlayImageRepeat = v; })} options={[{ value: "repeat", label: "Lặp cả hai" }, { value: "no-repeat", label: "Không lặp" }, { value: "repeat-x", label: "Lặp ngang" }, { value: "repeat-y", label: "Lặp dọc" }]} />
          </Row>
        </>
      )}

      {/* Separator */}
      <div className="text-[10px] uppercase tracking-wide text-gray-400 pt-2 pb-0.5">Đường phân cách</div>
      <Row label="Kiểu">
        <SelectInput
          value={separatorType}
          onChange={(v) => setProp((p) => { p.separatorType = v; })}
          options={[
            { value: "none", label: "Không có" },
            { value: "wave", label: "Sóng" },
            { value: "slant", label: "Xiên" },
            { value: "curve", label: "Cong" },
          ]}
        />
      </Row>
      {separatorType !== "none" && (
        <Row label="Màu">
          <ColorInput value={(props.separatorColor as string) ?? "#ffffff"} onChange={(v) => setProp((p) => { p.separatorColor = v; })} />
        </Row>
      )}
    </div>
  );
}

function ElementIdHeader({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (fn: (p: Record<string, unknown>) => void) => void;
}) {
  const elementId = (props.elementId as string) ?? "";

  const copyId = () => {
    if (elementId) void navigator.clipboard.writeText(elementId);
  };

  return (
    <div className="px-3 py-2 border-b border-gray-100 space-y-1.5">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">Element ID</div>
      <div className="flex gap-1">
        <input
          type="text"
          value={elementId}
          onChange={(e) => setProp((p) => { p.elementId = e.target.value; })}
          placeholder="el_xxxx"
          className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          type="button"
          onClick={copyId}
          title="Sao chép ID"
          className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function TextPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  const colorType = (props.colorType as string) ?? "solid";
  const textShadow = (props.textShadow as boolean) ?? false;
  const textStroke = (props.textStroke as boolean) ?? false;

  return (
    <div className="space-y-1">
      <Row label="Nội dung">
        <textarea
          value={(props.content as string) ?? ""}
          onChange={(e) => setProp((p) => { p.content = e.target.value; })}
          rows={3}
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-y"
        />
      </Row>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Chiều rộng"><NumberInput value={props.width as number} onChange={(v) => setProp((p) => { p.width = v; })} min={50} /></Row>
      <Row label="Cỡ chữ"><NumberInput value={props.fontSize as number} onChange={(v) => setProp((p) => { p.fontSize = v; })} min={8} max={200} /></Row>
      <Row label="Font"><SelectInput value={props.fontFamily as string} onChange={(v) => setProp((p) => { p.fontFamily = v; })} options={FONTS} /></Row>

      <Row label="Loại màu">
        <SelectInput
          value={colorType}
          onChange={(v) => setProp((p) => { p.colorType = v; })}
          options={[{ value: "solid", label: "Màu đơn" }, { value: "gradient", label: "Gradient" }]}
        />
      </Row>
      {colorType === "solid" && (
        <Row label="Màu chữ"><ColorInput value={props.color as string} onChange={(v) => setProp((p) => { p.color = v; })} /></Row>
      )}
      {colorType === "gradient" && (
        <>
          <Row label="Màu đầu"><ColorInput value={(props.gradientFrom as string) ?? "#ea6c88"} onChange={(v) => setProp((p) => { p.gradientFrom = v; })} /></Row>
          <Row label="Màu cuối"><ColorInput value={(props.gradientTo as string) ?? "#f5a623"} onChange={(v) => setProp((p) => { p.gradientTo = v; })} /></Row>
          <Row label="Góc (°)"><NumberInput value={(props.gradientAngle as number) ?? 90} onChange={(v) => setProp((p) => { p.gradientAngle = v; })} min={0} max={360} /></Row>
        </>
      )}
      <Row label="Căn lề">
        <SelectInput
          value={props.textAlign as string}
          onChange={(v) => setProp((p) => { p.textAlign = v; })}
          options={[{ value: "left", label: "Trái" }, { value: "center", label: "Giữa" }, { value: "right", label: "Phải" }]}
        />
      </Row>
      <Row label="Độ đậm">
        <SelectInput
          value={props.fontWeight as string}
          onChange={(v) => setProp((p) => { p.fontWeight = v; })}
          options={[{ value: "normal", label: "Thường" }, { value: "600", label: "Semibold" }, { value: "bold", label: "Bold" }]}
        />
      </Row>
      <Row label="In nghiêng">
        <SelectInput
          value={(props.fontStyle as string) ?? "normal"}
          onChange={(v) => setProp((p) => { p.fontStyle = v; })}
          options={[{ value: "normal", label: "Thường" }, { value: "italic", label: "In nghiêng" }]}
        />
      </Row>
      <Row label="Gạch chân">
        <SelectInput
          value={(props.textDecoration as string) ?? "none"}
          onChange={(v) => setProp((p) => { p.textDecoration = v; })}
          options={[
            { value: "none", label: "Không" },
            { value: "underline", label: "Gạch dưới" },
            { value: "line-through", label: "Gạch ngang" },
          ]}
        />
      </Row>
      <Row label="Biến đổi chữ">
        <SelectInput
          value={(props.textTransform as string) ?? "none"}
          onChange={(v) => setProp((p) => { p.textTransform = v; })}
          options={[
            { value: "none", label: "Không" },
            { value: "uppercase", label: "HOA" },
            { value: "lowercase", label: "thường" },
            { value: "capitalize", label: "Viết Hoa Đầu" },
          ]}
        />
      </Row>
      <Row label="Line height"><NumberInput value={props.lineHeight as number} onChange={(v) => setProp((p) => { p.lineHeight = v; })} min={0.8} max={4} step={0.1} /></Row>
      <Row label="Letter spacing"><NumberInput value={props.letterSpacing as number} onChange={(v) => setProp((p) => { p.letterSpacing = v; })} min={-5} max={30} step={0.5} /></Row>

      <ToggleRow label="Bóng chữ" value={textShadow} onChange={(v) => setProp((p) => { p.textShadow = v; })} />
      {textShadow && (
        <>
          <Row label="Màu bóng"><ColorInput value={(props.textShadowColor as string) ?? "#000000"} onChange={(v) => setProp((p) => { p.textShadowColor = v; })} /></Row>
          <Row label="Bóng X"><NumberInput value={(props.textShadowX as number) ?? 2} onChange={(v) => setProp((p) => { p.textShadowX = v; })} min={-30} max={30} /></Row>
          <Row label="Bóng Y"><NumberInput value={(props.textShadowY as number) ?? 2} onChange={(v) => setProp((p) => { p.textShadowY = v; })} min={-30} max={30} /></Row>
          <Row label="Bóng mờ"><NumberInput value={(props.textShadowBlur as number) ?? 4} onChange={(v) => setProp((p) => { p.textShadowBlur = v; })} min={0} max={40} /></Row>
        </>
      )}

      <ToggleRow label="Viền chữ" value={textStroke} onChange={(v) => setProp((p) => { p.textStroke = v; })} />
      {textStroke && (
        <>
          <Row label="Màu viền"><ColorInput value={(props.textStrokeColor as string) ?? "#000000"} onChange={(v) => setProp((p) => { p.textStrokeColor = v; })} /></Row>
          <Row label="Độ dày"><NumberInput value={(props.textStrokeWidth as number) ?? 1} onChange={(v) => setProp((p) => { p.textStrokeWidth = v; })} min={0.5} max={10} step={0.5} /></Row>
        </>
      )}
    </div>
  );
}

function ImagePanel({ props, setProp, selectedId }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void; selectedId: string }) {
  const imageFade = (props.imageFade as boolean) ?? false;
  const { actions, query } = useEditor();

  const CLIP_KEY = "mehappy_copied_frame";

  const copyFrame = async () => {
    try {
      const node = query.node(selectedId).get();
      const pdata = node?.data?.props as Record<string, unknown> | undefined;
      if (!pdata) return;
      const json = JSON.stringify(pdata);
      try {
        await navigator.clipboard.writeText(json);
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem(CLIP_KEY, json);
      } catch {
        /* ignore */
      }
      // small UI feedback could be added
    } catch (e) {
      /* ignore */
    }
  };

  const readClipboardOrStorage = async (): Promise<Record<string, unknown> | null> => {
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = "";
      }
      if (!text) {
        try {
          text = localStorage.getItem(CLIP_KEY) ?? "";
        } catch {
          text = "";
        }
      }
      if (!text) return null;
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const pasteIntoSelection = async () => {
    const data = await readClipboardOrStorage();
    if (!data) return;
    // don't overwrite elementId to keep current element identity
    delete (data as any).elementId;
    setProp((p) => {
      Object.assign(p, data);
    });
  };

  const pasteAsNew = async () => {
    const data = await readClipboardOrStorage();
    if (!data) return;
    try {
      const parentId = query.node(selectedId).get().data.parent ?? "ROOT";
      const siblings = query.node(parentId).get().data.nodes ?? [];
      const idx = siblings.indexOf(selectedId);
      const tree = query
        .parseReactElement(
          <Element is={ImageBlock} {...(data as any)} elementId={generateElementId()} />
        )
        .toNodeTree();
      actions.addNodeTree(tree, parentId, idx >= 0 ? idx + 1 : undefined);
    } catch (e) {
      // ignore failures
    }
  };

  return (
    <div className="space-y-1">
      <Row label="Ảnh">
        <ImageUrlInput
          value={(props.src as string) ?? ""}
          onChange={(v) => setProp((p) => { p.src = v; })}
        />
      </Row>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Rộng"><NumberInput value={props.width as number} onChange={(v) => setProp((p) => { p.width = v; })} min={20} /></Row>
      <Row label="Cao"><NumberInput value={props.height as number} onChange={(v) => setProp((p) => { p.height = v; })} min={20} /></Row>
      <Row label="Chế độ hiển thị">
        <SelectInput
          value={(props.objectFit as string) ?? "cover"}
          onChange={(v) => setProp((p) => { p.objectFit = v; })}
          options={[
            { value: "cover", label: "Vừa khít (Cover)" },
            { value: "contain", label: "Vừa khung (Contain)" },
            { value: "fill", label: "Lấp đầy (không giữ tỷ lệ)" },
            { value: "none", label: "Không xử lý" },
            { value: "scale-down", label: "Thu nhỏ" },
          ]}
        />
      </Row>
      <Row label="Bo góc"><NumberInput value={(props.borderRadius as number) ?? 0} onChange={(v) => setProp((p) => { p.borderRadius = v; })} min={0} max={200} /></Row>
      <Row label="Viền">
        <SelectInput
          value={(props.borderStyle as string) ?? "none"}
          onChange={(v) => setProp((p) => { p.borderStyle = v; })}
          options={[
            { value: "none", label: "Không" },
            { value: "solid", label: "Solid" },
            { value: "dashed", label: "Dashed" },
            { value: "dotted", label: "Dotted" },
            { value: "double", label: "Double" },
            { value: "groove", label: "Groove" },
            { value: "ridge", label: "Ridge" },
          ]}
        />
      </Row>
      {(props.borderStyle as string) !== "none" && (props.borderStyle as string) && (
        <>
          <Row label="Dày viền"><NumberInput value={(props.borderWidth as number) ?? 1} onChange={(v) => setProp((p) => { p.borderWidth = v; })} min={1} max={20} /></Row>
          <Row label="Màu viền"><ColorInput value={(props.borderColor as string) ?? "#cccccc"} onChange={(v) => setProp((p) => { p.borderColor = v; })} /></Row>
        </>
      )}
      <Row label="Độ mờ"><NumberInput value={(props.opacity as number) ?? 100} onChange={(v) => setProp((p) => { p.opacity = v; })} min={0} max={100} /></Row>

      <ToggleRow label="Mờ dần" value={imageFade} onChange={(v) => setProp((p) => { p.imageFade = v; })} />
      {imageFade && (
        <Row label="Hướng mờ">
          <SelectInput
            value={(props.imageFadeDirection as string) ?? "bottom"}
            onChange={(v) => setProp((p) => { p.imageFadeDirection = v; })}
            options={[
              { value: "bottom", label: "Xuống dưới" },
              { value: "top", label: "Lên trên" },
              { value: "left", label: "Sang trái" },
              { value: "right", label: "Sang phải" },
            ]}
          />
        </Row>
      )}

      <div className="text-[10px] uppercase tracking-wide text-gray-400 pt-2 pb-0.5">Vị trí ảnh</div>
      <Row label="Vị trí ảnh X (%)"><NumberInput value={(props.imagePosX as number) ?? 50} onChange={(v) => setProp((p) => { p.imagePosX = v; })} min={0} max={100} /></Row>
      <Row label="Vị trí ảnh Y (%)"><NumberInput value={(props.imagePosY as number) ?? 50} onChange={(v) => setProp((p) => { p.imagePosY = v; })} min={0} max={100} /></Row>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => setProp((p) => { p.imagePosX = 50; p.imagePosY = 50; })} className="px-3 py-1 text-sm rounded-md border border-gray-200 bg-white">Center image</button>
        <div className="text-xs text-gray-400">Kéo thanh % để điều chỉnh vị trí khuôn mặt</div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button onClick={copyFrame} className="px-3 py-1 text-sm rounded-md border border-gray-200 bg-white">Copy khung</button>
        <button onClick={pasteIntoSelection} className="px-3 py-1 text-sm rounded-md border border-gray-200 bg-white">Paste vào phần tử</button>
        <button onClick={pasteAsNew} className="px-3 py-1 text-sm rounded-md border border-gray-200 bg-white">Paste thành bản sao</button>
        <div className="text-xs text-gray-400">Sao chép/ dán khung ảnh (clipboard/localStorage)</div>
      </div>

      <div className="text-[10px] uppercase tracking-wide text-gray-400 pt-3 pb-0.5">Phóng & Zoom</div>
      <SliderRow
        label="Phóng to ảnh"
        value={(props.imageScale as number) ?? 1}
        min={0.5}
        max={3}
        onChange={(v) => setProp((p) => { p.imageScale = v; })}
      />
      <div className="flex items-center gap-2">
        <button onClick={() => setProp((p) => { p.imageScale = Math.max(0.5, (props.imageScale as number ?? 1) - 0.1); })} className="px-2 py-1 text-sm rounded-md border border-gray-200 bg-white">-</button>
        <button onClick={() => setProp((p) => { p.imageScale = Math.min(3, (props.imageScale as number ?? 1) + 0.1); })} className="px-2 py-1 text-sm rounded-md border border-gray-200 bg-white">+</button>
        <button onClick={() => setProp((p) => { p.imageScale = 1; })} className="px-3 py-1 text-sm rounded-md border border-gray-200 bg-white">Reset</button>
        <div className="text-xs text-gray-400">Zoom ảnh mà không thay đổi khung</div>
      </div>

      <div className="text-[10px] uppercase tracking-wide text-gray-400 pt-2 pb-0.5">Bộ lọc ảnh</div>
      <Row label="Hoà trộn">
        <SelectInput
          value={(props.imageBlendMode as string) ?? "normal"}
          onChange={(v) => setProp((p) => { p.imageBlendMode = v; })}
          options={BLEND_MODES_LIST.map((m) => ({ value: m, label: m }))}
        />
      </Row>
      {(["Contrast", "Brightness", "Saturate", "Grayscale", "Opacity", "Invert", "Sepia", "HueRotate"] as const).map((name) => {
        const key = `filter${name}` as string;
        const defaults: Record<string, number> = { filterContrast: 100, filterBrightness: 100, filterSaturate: 100, filterGrayscale: 0, filterOpacity: 100, filterInvert: 0, filterSepia: 0, filterHueRotate: 0 };
        const labels: Record<string, string> = { filterContrast: "Tương phản", filterBrightness: "Độ sáng", filterSaturate: "Bão hoà", filterGrayscale: "Xám hoá", filterOpacity: "Độ mờ", filterInvert: "Đảo màu", filterSepia: "Sepia", filterHueRotate: "Xoay màu (°)" };
        const maxes: Record<string, number> = { filterContrast: 200, filterBrightness: 200, filterSaturate: 200, filterGrayscale: 100, filterOpacity: 100, filterInvert: 100, filterSepia: 100, filterHueRotate: 360 };
        const imgFilter = (props.imageFilter as Record<string, number> | undefined) ?? {};
        const val = imgFilter[key] ?? defaults[key];
        return (
          <SliderRow
            key={key}
            label={labels[key]}
            value={val}
            min={0}
            max={maxes[key]}
            onChange={(v) => setProp((p) => {
              const f = (p.imageFilter as Record<string, number> | undefined) ?? {};
              p.imageFilter = { ...f, [key]: v };
            })}
          />
        );
      })}
    </div>
  );
}

function CountdownPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  const card = useEditorCard();
  const weddingDate = card.wedding_date
    ? new Date(card.wedding_date).toLocaleDateString("vi-VN", { dateStyle: "long" })
    : "Chưa đặt trong Cài đặt thiệp";

  return (
    <div className="space-y-1">
      <div className="py-1.5 px-1 mb-1 rounded-lg bg-indigo-50 border border-indigo-100">
        <p className="text-[10px] text-indigo-600 font-medium">Ngày cưới (từ cài đặt thiệp)</p>
        <p className="text-xs text-gray-700 mt-0.5">{weddingDate}</p>
        <p className="text-[10px] text-gray-400 mt-1">Sửa tại Dashboard → Cài đặt thiệp</p>
      </div>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Chiều rộng"><NumberInput value={props.width as number} onChange={(v) => setProp((p) => { p.width = v; })} min={100} /></Row>
      <Row label="Màu nền"><ColorInput value={(props.primaryColor as string) ?? "#ea6c88"} onChange={(v) => setProp((p) => { p.primaryColor = v; })} /></Row>
      <Row label="Màu số"><ColorInput value={(props.textColor as string) ?? "#ffffff"} onChange={(v) => setProp((p) => { p.textColor = v; })} /></Row>
      <Row label="Màu nhãn"><ColorInput value={(props.labelColor as string) ?? "#666666"} onChange={(v) => setProp((p) => { p.labelColor = v; })} /></Row>
      <Row label="Cỡ số"><NumberInput value={(props.digitFontSize as number) ?? 30} onChange={(v) => setProp((p) => { p.digitFontSize = v; })} min={12} max={80} /></Row>
    </div>
  );
}

function DividerPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  return (
    <div className="space-y-1">
      <Row label="Loại">
        <SelectInput
          value={props.type as string}
          onChange={(v) => setProp((p) => { p.type = v; })}
          options={[{ value: "line", label: "Đường thẳng" }, { value: "dots", label: "Chấm" }, { value: "wave", label: "Sóng" }, { value: "flowers", label: "Hoa" }]}
        />
      </Row>
      <Row label="Màu"><ColorInput value={(props.color as string) ?? "#d4a8b3"} onChange={(v) => setProp((p) => { p.color = v; })} /></Row>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Chiều rộng"><NumberInput value={props.width as number} onChange={(v) => setProp((p) => { p.width = v; })} min={20} /></Row>
      <Row label="Chiều cao"><NumberInput value={props.height as number} onChange={(v) => setProp((p) => { p.height = v; })} min={4} /></Row>
      <Row label="Độ mờ"><NumberInput value={(props.opacity as number) ?? 100} onChange={(v) => setProp((p) => { p.opacity = v; })} min={0} max={100} /></Row>
    </div>
  );
}

function ButtonPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  return (
    <div className="space-y-1">
      <Row label="Nhãn"><TextInput value={(props.label as string) ?? ""} onChange={(v) => setProp((p) => { p.label = v; })} /></Row>
      <Row label="URL"><TextInput value={(props.url as string) ?? "#"} onChange={(v) => setProp((p) => { p.url = v; })} /></Row>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Chiều rộng"><NumberInput value={props.width as number} onChange={(v) => setProp((p) => { p.width = v; })} min={80} /></Row>
      <Row label="Màu nền"><ColorInput value={(props.bgColor as string) ?? "#ea6c88"} onChange={(v) => setProp((p) => { p.bgColor = v; })} /></Row>
      <Row label="Màu chữ"><ColorInput value={(props.textColor as string) ?? "#ffffff"} onChange={(v) => setProp((p) => { p.textColor = v; })} /></Row>
      <Row label="Bo góc"><NumberInput value={(props.borderRadius as number) ?? 8} onChange={(v) => setProp((p) => { p.borderRadius = v; })} min={0} max={50} /></Row>
      <Row label="Cỡ chữ"><NumberInput value={(props.fontSize as number) ?? 16} onChange={(v) => setProp((p) => { p.fontSize = v; })} min={10} max={40} /></Row>
      <Row label="Padding X"><NumberInput value={(props.paddingX as number) ?? 24} onChange={(v) => setProp((p) => { p.paddingX = v; })} min={0} max={60} /></Row>
      <Row label="Padding Y"><NumberInput value={(props.paddingY as number) ?? 10} onChange={(v) => setProp((p) => { p.paddingY = v; })} min={0} max={40} /></Row>
    </div>
  );
}

function IconPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  const useCustom = !!(props.customSvg as string)?.trim();
  return (
    <div className="space-y-1">
      <Row label="SVG tùy chỉnh">
        <textarea
          value={(props.customSvg as string) ?? ""}
          onChange={(e) => setProp((p) => { p.customSvg = e.target.value; })}
          placeholder="<svg>...</svg>"
          rows={4}
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-y"
        />
      </Row>
      {!useCustom && (
      <Row label="Loại">
        <SelectInput
          value={(props.icon as string) ?? "heart"}
          onChange={(v) => setProp((p) => { p.icon = v; })}
          options={[
            { value: "heart", label: "Trái tim" },
            { value: "ring", label: "Nhẫn" },
            { value: "flower", label: "Hoa" },
            { value: "dove", label: "Bồ câu" },
            { value: "star", label: "Sao" },
            { value: "music", label: "Âm nhạc" },
          ]}
        />
      </Row>
      )}
      <Row label="Kích thước"><NumberInput value={(props.size as number) ?? 40} onChange={(v) => setProp((p) => { p.size = v; })} min={10} max={300} /></Row>
      <ToggleRow
        label="Khóa tỷ lệ W/H"
        value={(props.lockAspect as boolean) ?? true}
        onChange={(v) => setProp((p) => { p.lockAspect = v; })}
      />
      <Row label="Màu"><ColorInput value={(props.color as string) ?? "#ea6c88"} onChange={(v) => setProp((p) => { p.color = v; })} /></Row>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Xoay (°)"><NumberInput value={(props.rotate as number) ?? 0} onChange={(v) => setProp((p) => { p.rotate = v; })} min={0} max={360} /></Row>
      <Row label="Độ mờ"><NumberInput value={(props.opacity as number) ?? 100} onChange={(v) => setProp((p) => { p.opacity = v; })} min={0} max={100} /></Row>
    </div>
  );
}

function GiftBoxPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  return (
    <div className="space-y-1">
      <Row label="Tiêu đề">
        <input
          type="text"
          value={(props.titleText as string) ?? "Hộp Mừng Cưới"}
          onChange={(e) => setProp((p) => { p.titleText = e.target.value; })}
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
        />
      </Row>
      <Row label="Phụ đề">
        <input
          type="text"
          value={(props.subtitleText as string) ?? "Cảm ơn tình cảm của mọi người ♥"}
          onChange={(e) => setProp((p) => { p.subtitleText = e.target.value; })}
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
        />
      </Row>
      <Row label="Hiện QR">
        <input
          type="checkbox"
          checked={props.showQr !== false}
          onChange={(e) => setProp((p) => { p.showQr = e.target.checked; })}
          className="rounded"
        />
      </Row>
      <p className="text-[10px] text-gray-400 px-1">Thông tin ngân hàng & QR lấy từ Cài đặt thiệp.</p>
      <Row label="Vị trí T"><NumberInput value={props.top as number} onChange={(v) => setProp((p) => { p.top = v; })} /></Row>
      <Row label="Vị trí L"><NumberInput value={props.left as number} onChange={(v) => setProp((p) => { p.left = v; })} /></Row>
      <Row label="Rộng"><NumberInput value={props.width as number} onChange={(v) => setProp((p) => { p.width = v; })} min={100} /></Row>
      <Row label="Cao"><NumberInput value={props.height as number} onChange={(v) => setProp((p) => { p.height = v; })} min={100} /></Row>
      <Row label="Màu nền"><ColorInput value={(props.bgColor as string) ?? "#1a1a2e"} onChange={(v) => setProp((p) => { p.bgColor = v; })} /></Row>
      <Row label="Màu tiêu đề"><ColorInput value={(props.titleColor as string) ?? "#ffffff"} onChange={(v) => setProp((p) => { p.titleColor = v; })} /></Row>
      <Row label="Màu chữ"><ColorInput value={(props.textColor as string) ?? "#cccccc"} onChange={(v) => setProp((p) => { p.textColor = v; })} /></Row>
    </div>
  );
}

// ─── Section background filter panel ─────────────────────────────────────────

function SectionBgFilterPanel({ props, setProp }: { props: Record<string, unknown>; setProp: (fn: (p: Record<string, unknown>) => void) => void }) {
  return (
    <div className="space-y-1">
      <div className="py-1">
        <span className="text-xs text-gray-500">Chế độ hoà trộn nền</span>
        <select
          value={(props.bgBlendMode as string) ?? "normal"}
          onChange={(e) => setProp((p) => { p.bgBlendMode = e.target.value; })}
          className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
        >
          {BLEND_MODES_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <SliderRow label="Tương phản" value={(props.bgFilterContrast as number) ?? 100} min={0} max={200} onChange={(v) => setProp((p) => { p.bgFilterContrast = v; })} />
      <SliderRow label="Độ sáng" value={(props.bgFilterBrightness as number) ?? 100} min={0} max={200} onChange={(v) => setProp((p) => { p.bgFilterBrightness = v; })} />
      <SliderRow label="Bão hoà" value={(props.bgFilterSaturate as number) ?? 100} min={0} max={200} onChange={(v) => setProp((p) => { p.bgFilterSaturate = v; })} />
      <SliderRow label="Xám hoá" value={(props.bgFilterGrayscale as number) ?? 0} min={0} max={100} onChange={(v) => setProp((p) => { p.bgFilterGrayscale = v; })} />
      <SliderRow label="Độ mờ" value={(props.bgFilterOpacity as number) ?? 100} min={0} max={100} onChange={(v) => setProp((p) => { p.bgFilterOpacity = v; })} />
      <SliderRow label="Đảo màu" value={(props.bgFilterInvert as number) ?? 0} min={0} max={100} onChange={(v) => setProp((p) => { p.bgFilterInvert = v; })} />
      <SliderRow label="Sepia" value={(props.bgFilterSepia as number) ?? 0} min={0} max={100} onChange={(v) => setProp((p) => { p.bgFilterSepia = v; })} />
      <SliderRow label="Xoay màu (°)" value={(props.bgFilterHueRotate as number) ?? 0} min={0} max={360} onChange={(v) => setProp((p) => { p.bgFilterHueRotate = v; })} />
      <button
        onClick={() => setProp((p) => { p.bgBlendMode = "normal"; p.bgFilterContrast = 100; p.bgFilterBrightness = 100; p.bgFilterSaturate = 100; p.bgFilterGrayscale = 0; p.bgFilterOpacity = 100; p.bgFilterInvert = 0; p.bgFilterSepia = 0; p.bgFilterHueRotate = 0; })}
        className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 rounded border border-gray-100 hover:bg-gray-50 mt-1"
      >
        Đặt lại
      </button>
    </div>
  );
}

// ─── Main PropertyPanel ────────────────────────────────────────────────────────

type TabId = "design" | "events" | "animation" | "advanced";

const TABS: { id: TabId; label: string }[] = [
  { id: "design", label: "Thiết kế" },
  { id: "events", label: "Sự kiện" },
  { id: "animation", label: "Hiệu ứng" },
  { id: "advanced", label: "Nâng cao" },
];

export function PropertyPanel({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>("design");

  const { selected, actions, elementIds = [] } = useEditor((state, query) => {
    const ids: { id: string; label: string }[] = [];
    Object.keys(state.nodes).forEach((nodeId) => {
      try {
        const n = query.node(nodeId).get();
        const eid = (n.data.props as Record<string, unknown>)?.elementId as string;
        if (eid) {
          const label = (n.data.displayName ?? n.data.name ?? eid) as string;
          ids.push({ id: eid, label: `${label} (${eid})` });
        }
      } catch {
        /* skip */
      }
    });

    const selectedIds = Array.from(state.events.selected);
    const id = selectedIds[0];
    if (!id) return { selected: null, elementIds: ids };
    const node = state.nodes[id];
    if (!node) return { selected: null, elementIds: ids };

    return {
      selected: {
        id,
        name: node.data.displayName ?? node.data.name,
        props: node.data.props as Record<string, unknown>,
      },
      elementIds: ids,
    };
  });

  if (!selected) {
    return (
      <div className="p-4 text-xs text-gray-400 text-center">
        Chọn một phần tử để chỉnh sửa
      </div>
    );
  }

  const setProp = (fn: (p: Record<string, unknown>) => void) => {
    actions.setProp(selected.id, fn);
  };

  const { name, props } = selected;

  const renderElementPanel = () => {
    switch (name) {
      case "Section": return <SectionPanel props={props} setProp={setProp} />;
      case "Text": return <TextPanel props={props} setProp={setProp} />;
      case "Hình ảnh": return <ImagePanel props={props} setProp={setProp} selectedId={selected.id} />;
      case "Đếm ngược": return <CountdownPanel props={props} setProp={setProp} />;
      case "Đường kẻ": return <DividerPanel props={props} setProp={setProp} />;
      case "Nút bấm": return <ButtonPanel props={props} setProp={setProp} />;
      case "Icon": return <IconPanel props={props} setProp={setProp} />;
      case "Hộp mừng cưới": return <GiftBoxPanel props={props} setProp={setProp} />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col h-full ${embedded ? "editor-property-panel" : ""}`}>
      {!embedded && (
        <div className="px-3 py-2 border-b border-gray-100 bg-white flex items-center justify-between gap-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
            {name}
          </span>
        </div>
      )}

      {!embedded && <ElementIdHeader props={props} setProp={setProp} />}

      {/* Toolbar Actions */}
      <ToolbarActions selectedId={selected.id} />

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 prop-tab transition-colors ${
              activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-500 bg-white font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "design" && (
          <div>
            <div className="px-3 pt-3 pb-2">
              {renderElementPanel()}
            </div>

            {name === "Section" && (
              <Collapsible title="Bộ lọc nền">
                <SectionBgFilterPanel props={props} setProp={setProp} />
              </Collapsible>
            )}
            {name !== "Section" && (
              <Collapsible title="Bộ lọc & Hoà trộn">
                <FilterPanel props={props} setProp={setProp} />
              </Collapsible>
            )}

            <Collapsible title="Biến đổi 3D">
              <TransformPanel props={props} setProp={setProp} />
            </Collapsible>

            <Collapsible title="Đổ bóng">
              <BoxShadowPanel props={props} setProp={setProp} />
            </Collapsible>
          </div>
        )}

        {activeTab === "events" && (
          <div className="p-3">
            <EventsPanel props={props} setProp={setProp} elementIds={elementIds} />
          </div>
        )}

        {activeTab === "animation" && (
          <div className="p-3">
            <AnimationPanel props={props} setProp={setProp} nodeId={selected.id} />
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="p-3 space-y-2">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Nâng cao</div>
              <Row label="Z-Index">
                <NumberInput
                  value={(props.zIndex as number) ?? 0}
                  onChange={(v) => setProp((p) => { p.zIndex = v; })}
                  min={-10}
                  max={100}
                />
              </Row>
              <ToggleRow
                label="Ẩn phần tử"
                value={(props.hidden as boolean) ?? false}
                onChange={(v) => setProp((p) => { p.hidden = v; })}
              />
              <ToggleRow
                label="Khoá (không kéo)"
                value={(props.locked as boolean) ?? false}
                onChange={(v) => setProp((p) => { p.locked = v; })}
              />
              <ToggleRow
                label="Ghim cố định (sticky)"
                value={(props.stickyEnabled as boolean) ?? false}
                onChange={(v) => setProp((p) => { p.stickyEnabled = v; })}
              />
              <Row label="Class CSS">
                <TextInput
                  value={(props.customClass as string) ?? ""}
                  onChange={(v) => setProp((p) => { p.customClass = v; })}
                  placeholder="my-class another-class"
                />
              </Row>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
