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

// 이미지 강제 다운로드 (cross-origin URL은 <a download>가 무시되므로 blob으로 받아서 저장)
export async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
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
