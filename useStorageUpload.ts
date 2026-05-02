import { supabase } from "@/lib/supabase";

/**
 * Converts a base64 dataURL to a Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads a base64 image or File to Supabase Storage
 * Returns the public URL or null on error
 */
export async function uploadToStorage(
  source: string | File,
  folder: string,
  fileName: string
): Promise<string | null> {
  try {
    let blob: Blob;
    let ext = "jpg";

    if (typeof source === "string") {
      // base64 dataURL
      blob = dataURLtoBlob(source);
      const mime = blob.type;
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
    } else {
      blob = source;
      const parts = source.name.split(".");
      ext = parts[parts.length - 1] || "jpg";
    }

    const path = `${folder}/${fileName}.${ext}`;

    const { error } = await supabase.storage
      .from("documentos")
      .upload(path, blob, { upsert: true, contentType: blob.type });

    if (error) {
      console.error("Storage upload error:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("documentos").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}
