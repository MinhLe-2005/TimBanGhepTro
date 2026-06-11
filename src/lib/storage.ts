import { supabase } from "./supabase";

const STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/";

export const isInlineImage = (value?: string | null) =>
  typeof value === "string" && value.startsWith("data:image/");

export const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const uploadInlineImage = async (
  bucket: string,
  path: string,
  dataUrl: string
) => {
  const blob = await dataUrlToBlob(dataUrl);
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type || "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const getPublicStorageObject = (url?: string | null) => {
  if (!url) return null;
  const markerIndex = url.indexOf(STORAGE_PUBLIC_MARKER);
  if (markerIndex < 0) return null;
  const objectReference = decodeURIComponent(
    url.slice(markerIndex + STORAGE_PUBLIC_MARKER.length).split("?")[0]
  );
  const slashIndex = objectReference.indexOf("/");
  if (slashIndex < 1) return null;
  return {
    bucket: objectReference.slice(0, slashIndex),
    path: objectReference.slice(slashIndex + 1),
  };
};

export const removePublicStorageUrls = async (
  urls: Array<string | null | undefined>,
  expectedBucket?: string
) => {
  const groupedPaths = new Map<string, Set<string>>();
  urls.forEach((url) => {
    const object = getPublicStorageObject(url);
    if (!object || (expectedBucket && object.bucket !== expectedBucket)) return;
    if (!groupedPaths.has(object.bucket)) groupedPaths.set(object.bucket, new Set());
    groupedPaths.get(object.bucket)?.add(object.path);
  });

  for (const [bucket, pathSet] of groupedPaths) {
    const paths = [...pathSet];
    if (paths.length === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  }
};
