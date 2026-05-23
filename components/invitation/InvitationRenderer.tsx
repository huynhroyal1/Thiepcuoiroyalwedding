"use client";

import { ClassicWhite } from "@/components/invitation/templates/ClassicWhite";
import { GoldenLuxury } from "@/components/invitation/templates/GoldenLuxury";
import { MinimalModern } from "@/components/invitation/templates/MinimalModern";
import { CraftJsViewer } from "@/components/invitation/CraftJsViewer";
import { InvitationHTMLViewer } from "@/components/invitation/InvitationHTMLViewer";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";
import type { TemplateProps } from "@/components/invitation/InvitationSections";
import { isCraftContentJson } from "@/lib/editor/sanitizeCraftContent";

const TEMPLATES = {
  "classic-white": ClassicWhite,
  "golden-luxury": GoldenLuxury,
  "minimal-modern": MinimalModern,
} as const;

export function InvitationRenderer(props: TemplateProps) {
  const cj = props.card.content_json;

  let body: React.ReactNode;

  if (cj && typeof cj === "object" && (cj as Record<string, unknown>).type === "raw-html") {
    // MeHappy-format raw HTML card
    body = <InvitationHTMLViewer html={(cj as Record<string, unknown>).html as string} />;
  } else if (isCraftContentJson(cj)) {
    body = (
      <CraftJsViewer
        card={props.card}
        contentJson={cj}
        renderVersion={props.renderVersion}
      />
    );
  } else {
    // Legacy template
    const Template = TEMPLATES[props.card.template_id as keyof typeof TEMPLATES] ?? ClassicWhite;
    body = <Template {...props} />;
  }

  return <InvitationExperience card={props.card}>{body}</InvitationExperience>;
}
