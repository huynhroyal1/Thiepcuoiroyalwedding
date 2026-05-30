import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const maxWidth = parseInt(formData.get("maxWidth") as string) || 2560;
    const maxHeight = parseInt(formData.get("maxHeight") as string) || 1920;
    const quality = parseInt(formData.get("quality") as string) || 88;

    if (!file) {
      return NextResponse.json(
        { error: "Không có file ảnh" },
        { status: 400 }
      );
    }

    // Chuyển File thành Buffer
    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Dùng Sharp để resize + compress
    // Quality cao (88-92) để giữ chất lượng, resolution 2560x1920 để chi tiết
    const compressedBuffer = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat("webp", { quality })
      .toBuffer();

    // Trả về ảnh đã nén
    return new NextResponse(compressedBuffer, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": compressedBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Lỗi nén ảnh:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý ảnh: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
