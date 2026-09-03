"use client";

import { useState, useRef, useEffect } from "react";
import { supabase, uploadImage } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  existingTitles: string[];
}

interface SearchResult {
  slug: string;
  title: string;
  thumbnailUrl: string | null;
}

const normalize = (t: string) => t.trim().toLowerCase();

export default function AddWebtoonModal({ onClose, onSuccess, existingTitles }: Props) {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [externalThumbnailUrl, setExternalThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [tappySearch, setTappySearch] = useState("");
  const [tappyResults, setTappyResults] = useState<SearchResult[]>([]);
  const [tappyLoading, setTappyLoading] = useState(false);
  const [tappyError, setTappyError] = useState("");
  const [tappyOpen, setTappyOpen] = useState(false);
  const [tappyActive, setTappyActive] = useState(0);
  const [importedFrom, setImportedFrom] = useState<SearchResult | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const registered = new Set(existingTitles.map(normalize));
  const isDuplicate = title.trim().length > 0 && registered.has(normalize(title));

  useEffect(() => {
    const query = tappySearch.trim();
    if (!query) {
      setTappyResults([]);
      setTappyError("");
      return;
    }

    // 느린 이전 요청이 나중에 도착해 최신 결과를 덮어쓰지 않도록 막습니다.
    let active = true;
    const timer = setTimeout(async () => {
      setTappyLoading(true);
      setTappyError("");
      try {
        const res = await fetch(`/api/tappytoon/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!active) return;
        if (data.error) throw new Error(data.error);
        setTappyResults(data.results || []);
        setTappyActive(0);
      } catch {
        if (!active) return;
        setTappyResults([]);
        setTappyError("검색에 실패했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (active) setTappyLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tappySearch]);

  // 키보드로 옮긴 항목이 목록 밖에 있으면 보이도록 스크롤합니다.
  useEffect(() => {
    itemRefs.current[tappyActive]?.scrollIntoView({ block: "nearest" });
  }, [tappyActive]);

  const selectTappyResult = (result: SearchResult) => {
    setTappyOpen(false);
    setTappySearch(result.title);
    setImportedFrom(result);
    setTitle(result.title);
    setThumbnail(null);
    setExternalThumbnailUrl(result.thumbnailUrl);
    setThumbnailPreview(result.thumbnailUrl);
    setError("");
  };

  const clearImported = () => {
    setImportedFrom(null);
    setTappySearch("");
    setTappyResults([]);
    setTitle("");
    // 직접 올린 이미지가 있으면 남겨두고 Tappytoon 표지만 지웁니다.
    if (!thumbnail) {
      setExternalThumbnailUrl(null);
      setThumbnailPreview(null);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setTappyOpen(false);
      return;
    }
    if (!tappyOpen || tappyResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setTappyActive((i) => (i + 1) % tappyResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTappyActive((i) => (i - 1 + tappyResults.length) % tappyResults.length);
    } else if (e.key === "Enter") {
      // 입력창이 form 안에 있어서 막지 않으면 폼이 제출됩니다.
      e.preventDefault();
      const target = tappyResults[tappyActive];
      if (target) selectTappyResult(target);
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
        registered_by: null,
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
              onKeyDown={handleSearchKeyDown}
              placeholder="영문 작품명으로 검색… (예: solo leveling)"
              role="combobox"
              aria-expanded={tappyOpen}
              aria-autocomplete="list"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            />

            {tappyOpen && tappySearch.trim().length > 0 && (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-md z-10 overflow-hidden max-h-64 overflow-y-auto"
              >
                {tappyLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 animate-pulse">
                      <div className="w-8 h-11 rounded bg-surface-2 shrink-0" />
                      <div className="h-3 bg-surface-2 rounded flex-1" />
                    </div>
                  ))
                ) : tappyError ? (
                  <p className="px-3 py-2.5 text-xs text-ink-muted">{tappyError}</p>
                ) : tappyResults.length === 0 ? (
                  <div className="px-3 py-2.5">
                    <p className="text-xs text-ink-muted">검색 결과가 없어요</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      Tappytoon 공식 사이트가 영문 기준이라 영문 작품명으로 검색해 주세요
                    </p>
                  </div>
                ) : (
                  tappyResults.map((r, i) => {
                    const added = registered.has(normalize(r.title));
                    return (
                      <button
                        key={r.slug}
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        type="button"
                        role="option"
                        aria-selected={i === tappyActive}
                        onMouseDown={() => selectTappyResult(r)}
                        onMouseEnter={() => setTappyActive(i)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${
                          i === tappyActive ? "bg-surface-2" : "bg-white"
                        }`}
                      >
                        {r.thumbnailUrl ? (
                          <img
                            src={r.thumbnailUrl}
                            alt=""
                            loading="lazy"
                            className="w-8 h-11 object-cover rounded shrink-0 bg-surface-2"
                          />
                        ) : (
                          <div className="w-8 h-11 rounded bg-surface-2 flex items-center justify-center text-sm shrink-0">
                            📖
                          </div>
                        )}
                        <span className="flex-1 text-sm text-ink line-clamp-2">{r.title}</span>
                        {added && (
                          <span className="shrink-0 text-[10px] font-semibold text-ink-faint bg-surface-2 border border-border rounded-full px-1.5 py-0.5">
                            등록됨
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {importedFrom && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-medium text-accent">✓ Tappytoon에서 가져옴</span>
                <button
                  type="button"
                  onClick={clearImported}
                  className="text-xs text-ink-faint hover:text-accent underline transition-colors"
                >
                  해제
                </button>
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
            {isDuplicate && (
              <p className="text-xs text-ink-muted bg-surface-2 border border-border rounded-lg px-3 py-2 mt-1.5">
                같은 이름의 작품이 이미 등록되어 있어요. 그대로 등록하면 목록에 두 개가 보입니다.
              </p>
            )}
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
