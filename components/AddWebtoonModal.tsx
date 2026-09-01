"use client";

import { useState, useRef, useEffect } from "react";
import { supabase, uploadImage } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface SearchResult {
  slug: string;
  title: string;
}

export default function AddWebtoonModal({ onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [externalThumbnailUrl, setExternalThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [tappySearch, setTappySearch] = useState("");
  const [tappyResults, setTappyResults] = useState<SearchResult[]>([]);
  const [tappyLoading, setTappyLoading] = useState(false);
  const [tappyOpen, setTappyOpen] = useState(false);

  useEffect(() => {
    if (!tappySearch.trim()) {
      setTappyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setTappyLoading(true);
      try {
        const res = await fetch(`/api/tappytoon/search?q=${encodeURIComponent(tappySearch)}`);
        const data = await res.json();
        setTappyResults(data.results || []);
      } catch {
        setTappyResults([]);
      } finally {
        setTappyLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tappySearch]);

  const selectTappyResult = async (result: SearchResult) => {
    setTappyOpen(false);
    setTappySearch(result.title);
    setTappyLoading(true);
    try {
      const res = await fetch(`/api/tappytoon/book?slug=${result.slug}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTitle(data.title);
      setThumbnail(null);
      setExternalThumbnailUrl(data.thumbnailUrl);
      setThumbnailPreview(data.thumbnailUrl);
    } catch (err: any) {
      setError(err.message || "작품 정보를 불러오지 못했어요");
    } finally {
      setTappyLoading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요");
      return;
    }
    setExternalThumbnailUrl(null);
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("작품명을 입력해주세요"); return; }
    if (!registeredBy.trim()) { setError("등록자 이름을 입력해주세요"); return; }

    setLoading(true);
    setError("");

    try {
      let thumbnailUrl: string | null = externalThumbnailUrl;
      if (thumbnail) {
        const path = `${Date.now()}_${thumbnail.name.replace(/\s/g, "_")}`;
        thumbnailUrl = await uploadImage("webtoon-thumbnails", thumbnail, path);
      }

      const { error: dbError } = await supabase.from("webtoons").insert({
        title: title.trim(),
        registered_by: registeredBy.trim(),
        thumbnail_url: thumbnailUrl,
      });

      if (dbError) throw dbError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || "저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-ink">작품 추가</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-ink-faint transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tappytoon 검색 */}
          <div className="relative">
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Tappytoon에서 찾기 <span className="text-ink-faint font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={tappySearch}
              onChange={(e) => {
                setTappySearch(e.target.value);
                setTappyOpen(true);
              }}
              onFocus={() => setTappyOpen(true)}
              onBlur={() => setTimeout(() => setTappyOpen(false), 150)}
              placeholder="작품명으로 검색…"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            />
            {tappyOpen && (tappyLoading || tappyResults.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-md z-10 overflow-hidden max-h-56 overflow-y-auto">
                {tappyLoading && (
                  <p className="px-3 py-2 text-xs text-ink-faint">검색 중…</p>
                )}
                {!tappyLoading &&
                  tappyResults.map((r) => (
                    <button
                      key={r.slug}
                      type="button"
                      onMouseDown={() => selectTappyResult(r)}
                      className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-2 transition-colors"
                    >
                      {r.title}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* 작품명 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              작품명 <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 나 혼자만 레벨업"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            />
          </div>

          {/* 등록자 이름 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              등록자 이름 <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={registeredBy}
              onChange={(e) => setRegisteredBy(e.target.value)}
              placeholder="예: Riley"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            />
          </div>

          {/* 썸네일 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              썸네일 이미지 <span className="text-ink-faint font-normal">(선택)</span>
            </label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="미리보기"
                    className="w-24 h-32 object-cover rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnail(null);
                      setThumbnailPreview(null);
                      setExternalThumbnailUrl(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white rounded-full text-xs flex items-center justify-center hover:bg-accent-hover"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-2xl mb-1">🖼️</p>
                  <p className="text-xs text-ink-faint">
                    클릭하거나 이미지를 드래그해서 올려주세요
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-xs text-accent bg-accent-soft rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-ink-muted hover:bg-surface-2 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? "저장 중…" : "작품 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
