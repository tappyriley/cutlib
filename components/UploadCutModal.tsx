"use client";

import { useState, useRef } from "react";
import { supabase, uploadImage } from "@/lib/supabase";

interface Props {
  webtoonId: string;
  existingTags: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadCutModal({
  webtoonId,
  existingTags,
  onClose,
  onSuccess,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [episode, setEpisode] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggestions = existingTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) &&
      tagInput.length > 0 &&
      !tags.includes(t)
  );

  const handleFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith("image/"));
    if (valid.length !== newFiles.length) {
      setError("이미지 파일만 업로드할 수 있어요");
    }
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addTag = (tag: string) => {
    const cleaned = tag.trim().replace(/^#/, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput("");
    setShowSuggestions(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { setError("컷 이미지를 1장 이상 선택해주세요"); return; }
    if (!uploaderName.trim()) { setError("업로더 이름을 입력해주세요"); return; }

    setLoading(true);
    setError("");

    try {
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${webtoonId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const imageUrl = await uploadImage("cut-images", file, path);

        const { error: dbError } = await supabase.from("cuts").insert({
          webtoon_id: webtoonId,
          image_url: imageUrl,
          episode: episode ? parseInt(episode) : null,
          tags,
          memo: memo.trim() || null,
          uploader_name: uploaderName.trim(),
        });

        if (dbError) throw dbError;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "업로드에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-ink">컷 업로드</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-ink-faint transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">

            {/* 이미지 업로드 영역 */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                컷 이미지 <span className="text-accent">*</span>
                <span className="font-normal text-ink-faint ml-1">여러 장 선택 가능</span>
              </label>

              {/* 드롭존 */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent/50 transition-colors cursor-pointer mb-3"
                onDrop={(e) => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
              >
                <p className="text-xl mb-1">📁</p>
                <p className="text-xs text-ink-faint">클릭하거나 파일을 드래그해서 추가</p>
                <p className="text-xs text-ink-faint">JPG · PNG · WEBP · 최대 10MB/장</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(Array.from(e.target.files));
                }}
              />

              {/* 미리보기 */}
              {previews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`컷 ${i + 1}`}
                        className="w-16 h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center hover:bg-accent-hover"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 업로더 이름 */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                업로더 이름 <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="예: Riley"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              />
            </div>

            {/* 화수 */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                화수 <span className="text-ink-faint font-normal">(선택)</span>
              </label>
              <input
                type="number"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                placeholder="예: 37"
                min="1"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              />
            </div>

            {/* 태그 */}
            <div className="relative">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                태그 <span className="text-ink-faint font-normal">(선택 · Enter로 추가)</span>
              </label>
              <div className="min-h-[42px] px-3 py-2 border border-border rounded-lg flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition cursor-text"
                onClick={() => document.getElementById("tagInput")?.focus()}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-surface-2 text-ink-muted text-xs font-medium px-2 py-0.5 rounded-full border border-border"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags((p) => p.filter((t) => t !== tag))}
                      className="text-ink-faint hover:text-accent"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  id="tagInput"
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={tags.length === 0 ? "감동, 액션, 코믹 등…" : ""}
                  className="flex-1 min-w-[80px] outline-none text-sm text-ink placeholder:text-ink-faint bg-transparent"
                />
              </div>

              {/* 자동완성 */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-md z-10 overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => addTag(s)}
                      className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-2 transition-colors"
                    >
                      #{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                메모 / 코멘트 <span className="text-ink-faint font-normal">(선택)</span>
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="이 컷을 고른 이유나 활용 아이디어를 적어두세요"
                rows={2}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition resize-none"
              />
            </div>

            {/* 에러 */}
            {error && (
              <p className="text-xs text-accent bg-accent-soft rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </form>

        {/* 푸터 */}
        <div className="px-6 pb-6 pt-2 flex gap-2 shrink-0 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-ink-muted hover:bg-surface-2 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {loading
              ? `업로드 중… (${files.length}장)`
              : `업로드 (${files.length}장)`}
          </button>
        </div>
      </div>
    </div>
  );
}
