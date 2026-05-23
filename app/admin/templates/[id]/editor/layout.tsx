import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Template Editor | Admin",
};

/** Full-screen editor — no admin sidebar (see app/admin/(with-sidebar)/layout.tsx). */
export default function TemplateEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-gray-100">
      {children}
    </div>
  );
}
