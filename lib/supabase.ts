import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 이미지 업로드 헬퍼
export async function uploadImage(
  bucket: string,
  file: File,
  path: string
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

const KNOWN_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "svg"]);

// 업로드할 때 원본 확장자를 그대로 경로에 넣으므로 URL에서 먼저 찾습니다.
// 알아볼 수 없는 값이면 응답의 MIME 타입으로 판단합니다.
function extensionFor(url: string, mimeType: string) {
  const fileName = url.split(/[?#]/)[0].split("/").pop() || "";
  const dot = fileName.lastIndexOf(".");
  const fromUrl = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
  if (KNOWN_EXTENSIONS.has(fromUrl)) return fromUrl;

  return MIME_EXTENSIONS[mimeType.split(";")[0].trim().toLowerCase()] || "jpg";
}

// 이미지 강제 다운로드 (cross-origin URL은 <a download>가 무시되므로 blob으로 받아서 저장)
// baseName에는 확장자를 넣지 마세요. 원본 확장자를 붙여서 저장합니다.
export async function downloadImage(url: string, baseName: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${baseName}.${extensionFor(url, blob.type)}`;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

// 즐겨찾기(픽) — localStorage 기반
export const picks = {
  get(): string[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("cutlib_picks") || "[]");
    } catch {
      return [];
    }
  },
  toggle(cutId: string): boolean {
    const current = picks.get();
    const isPicked = current.includes(cutId);
    const updated = isPicked
      ? current.filter((id) => id !== cutId)
      : [...current, cutId];
    localStorage.setItem("cutlib_picks", JSON.stringify(updated));
    return !isPicked;
  },
  has(cutId: string): boolean {
    return picks.get().includes(cutId);
  },
};
