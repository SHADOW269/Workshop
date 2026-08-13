import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadImage(
  file: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        quality: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(file);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}

export function optimizeImage(
  url: string,
  width?: number,
  height?: number
): string {
  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  const parts = url.split("/upload/");
  if (parts.length !== 2) {
    return url;
  }

  const transformations: string[] = ["f_auto", "q_auto"];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  return `${parts[0]}/upload/${transformations.join(",")}/${parts[1]}`;
}
