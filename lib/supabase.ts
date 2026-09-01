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
