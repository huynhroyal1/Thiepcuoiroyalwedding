import Link from "next/link";

export function TemplatePreviewBanner({ templateName }: { templateName: string }) {
  return (
    <div className="sticky top-0 z-[100] border-b border-indigo-200 bg-indigo-50 px-4 py-2.5 text-center text-sm text-indigo-950">
      <span className="font-medium">Xem trước mẫu</span>
      <span className="mx-1.5 text-indigo-700">—</span>
      <strong>{templateName}</strong>
      <span className="mx-1.5 text-indigo-700">·</span>
      Dữ liệu demo (tên, ngày cưới mẫu).{" "}
      <Link href="/register" className="font-medium underline hover:text-indigo-900">
        Đăng ký
      </Link>{" "}
      để dùng mẫu cho thiệp của bạn, hoặc{" "}
      <Link href="/kho-giao-dien" className="font-medium underline hover:text-indigo-900">
        xem kho giao diện
      </Link>
      .
    </div>
  );
}
