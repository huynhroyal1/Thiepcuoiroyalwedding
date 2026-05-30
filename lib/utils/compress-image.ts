/**
 * Utility để nén ảnh trước khi upload
 * Hỗ trợ resize + compress tự động
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100, default 80
}

/**
 * Nén ảnh sử dụng server API (Sharp)
 * Lợi ích: đáng tin cậy, hỗ trợ tất cả định dạng
 */
export async function compressImageViaServer(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
  } = options;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("maxWidth", maxWidth.toString());
    formData.append("maxHeight", maxHeight.toString());
    formData.append("quality", quality.toString());

    const response = await fetch("/api/compress-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server compression failed: ${response.statusText}`);
    }

    const compressedBlob = await response.blob();
    
    // Tạo File mới từ Blob đã nén
    const filename = file.name.replace(/\.[^/.]+$/, ".webp");
    const compressedFile = new File([compressedBlob], filename, {
      type: "image/webp",
    });

    return compressedFile;
  } catch (error) {
    console.error("Lỗi nén ảnh trên server:", error);
    throw error;
  }
}

/**
 * Nén ảnh phía client (fallback nếu server không khả dụng)
 * Sử dụng Canvas API - có thể không đạt chất lượng bằng Sharp
 */
export async function compressImageViaClient(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8, // Canvas sử dụng 0-1
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Tính toán kích thước mới
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể khởi tạo canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas blob trống"));
              return;
            }

            const filename = file.name.replace(/\.[^/.]+$/, ".webp");
            const compressedFile = new File([blob], filename, {
              type: "image/webp",
            });

            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Không thể tải ảnh"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Không thể đọc file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Hàm chính - cố gắng nén bằng server trước, nếu lỗi thì dùng client
 * Mục tiêu: Giữ ảnh 3-4MB với chất lượng tốt
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // Nếu file nhỏ hơn 1.5MB, không cần nén
  if (file.size < 1.5 * 1024 * 1024) {
    return file;
  }

  try {
    // Cố gắng server compression trước
    return await compressImageViaServer(file, options);
  } catch (error) {
    console.warn("Server compression thất bại, chuyển sang client:", error);
    try {
      // Fallback sang client compression
      return await compressImageViaClient(file, options);
    } catch (clientError) {
      console.warn("Cả server và client compression đều thất bại:", clientError);
      // Nếu cả hai đều lỗi, trả lại file gốc
      return file;
    }
  }
}

/**
 * Lấy kích thước file đã nén
 */
export function getFileSizeKB(file: File): number {
  return Math.round(file.size / 1024);
}

/**
 * Format kích thước file
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
