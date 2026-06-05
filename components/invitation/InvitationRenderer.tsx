"use client";

import { ClassicWhite } from "@/components/invitation/templates/ClassicWhite";
import { GoldenLuxury } from "@/components/invitation/templates/GoldenLuxury";
import { MinimalModern } from "@/components/invitation/templates/MinimalModern";
import { CraftJsViewer } from "@/components/invitation/CraftJsViewer";
import { InvitationHTMLViewer } from "@/components/invitation/InvitationHTMLViewer";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";
import { InvitationSections } from "@/components/invitation/InvitationSections";
import type { TemplateProps } from "@/components/invitation/InvitationSections";
import { isCraftContentJson } from "@/lib/editor/sanitizeCraftContent";

const TEMPLATES = {
  "classic-white": ClassicWhite,
  "golden-luxury": GoldenLuxury,
  "minimal-modern": MinimalModern,
} as const;

/**
 * True when content_json is raw HTML imported from MeHappy/mehappy.
 * Format: {"html": "<div...", ...} — no `type` field, no ROOT node.
 * Detected by checking for a top-level `html` string property.
 */
function isRawHtmlContent(content: unknown): boolean {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;
  // Explicit type field (standard format)
  if (c.type === "raw-html") return true;
  // Legacy imported format: {"html": "<div..."} or {"html": "<html..."}
  if (typeof c.html === "string" && c.html.trim().length > 0) return true;
  return false;
}

export function InvitationRenderer(props: TemplateProps) {
  const cj = props.card.content_json;

  let body: React.ReactNode;

  if (isRawHtmlContent(cj)) {
    // MeHappy-format raw HTML card (legacy imported)
    const html = (cj as Record<string, unknown>).html;
    body = <InvitationHTMLViewer html={typeof html === "string" ? html : ""} />;
  } else if (isCraftContentJson(cj)) {
    body = (
      <>
        <CraftJsViewer
          card={props.card}
          contentJson={cj}
          renderVersion={props.renderVersion}
        />
        <InvitationSections {...props} theme="minimal" />
      </>
    );
  } else {
    // Legacy template
    const Template = TEMPLATES[props.card.template_id as keyof typeof TEMPLATES] ?? ClassicWhite;
    body = <Template {...props} />;
  }

  return <InvitationExperience card={props.card}>{body}</InvitationExperience>;
}
