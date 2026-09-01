"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Webtoon, Cut } from "@/types";
import CutCard from "@/components/CutCard";
import UploadCutModal from "@/components/UploadCutModal";
import Lightbox from "@/components/Lightbox";

export default function WebtoonPage() {
  const params = useParams();
  const id = params.id as string;

  const [webtoon, setWebtoon] = useState<Webtoon | null>(null);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxCut, setLightboxCut] = useState<Cut | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [webtoonRes, cutsRes] = await Promise.all([
      supabase.from("webtoons").select("*").eq("id", id).single(),
      supabase
        .from("cuts")
        .select("*")
        .eq("webtoon_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (webtoonRes.data) setWebtoon(webtoonRes.data);
    if (cutsRes.data) {
      setCuts(cutsRes.data);
      // 전체 태그 수집
      const tags = Array.from(
        new Set(cutsRes.data.flatMap((c: Cut) => c.tags))
      ).filter(Boolean) as string[];
      setAllTags(tags);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCuts = selectedTag
    ? cuts.filter((c) => c.tags.includes(selectedTag))
    : cuts;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-6 w-48 bg-white rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-surface-2" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-surface-2 rounded w-2/3" />
                <div className="h-3 bg-surface-2 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!webtoon) {
    return (
      <div className="text-center py-24 text-ink-faint">
        <p>작품을 찾을 수 없어요</p>
        <a href="/" className="text-accent text-sm mt-2 inline-block hover:underline">
          홈으로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* 브레드크럼 */}
      <nav className="text-xs text-ink-faint mb-4 flex items-center gap-1.5">
        <a href="/" className="hover:text-accent transition-colors">홈</a>
        <span>/</span>
        <span className="text-ink-muted">{webtoon.title}</span>
      </nav>

      {/* 작품 헤더 */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6 flex flex-col sm:flex-row gap-5">
        {/* 썸네일 */}
        <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-lg overflow-hidden bg-surface-2 shrink-0">
          {webtoon.thumbnail_url ? (
            <img
              src={webtoon.thumbnail_url}
              alt={webtoon.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
              📖
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink tracking-tight mb-1">
            {webtoon.title}
          </h1>
          <p className="text-xs text-ink-faint mb-3">
            등록자: {webtoon.registered_by}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-accent">
              {cuts.length}컷
            </span>
            {allTags.length > 0 && (
              <span className="text-xs text-ink-faint">
                태그 {allTags.length}개
              </span>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <span>+</span> 컷 업로드
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-surface-2 hover:bg-border text-ink-muted text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {copied ? "✓ 복사됨" : "🔗 링크 복사"}
          </button>
        </div>
      </div>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
              selectedTag === null
                ? "bg-accent text-white"
                : "bg-white border border-border text-ink-muted hover:border-accent/50"
            }`}
          >
            전체
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                selectedTag === tag
                  ? "bg-accent text-white"
                  : "bg-white border border-border text-ink-muted hover:border-accent/50"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 컷 수 표시 */}
      {selectedTag && (
        <p className="text-xs text-ink-faint mb-4">
          #{selectedTag} 태그 · {filteredCuts.length}컷
        </p>
      )}

      {/* 컷 없음 */}
      {filteredCuts.length === 0 && (
        <div className="text-center py-24 text-ink-faint space-y-2">
          <p className="text-3xl">{selectedTag ? "🔍" : "🖼️"}</p>
          <p className="text-sm font-medium text-ink-muted">
            {selectedTag
              ? `#${selectedTag} 태그가 달린 컷이 없어요`
              : "아직 업로드된 컷이 없어요"}
          </p>
          {!selectedTag && (
            <p className="text-xs">위의 "컷 업로드" 버튼으로 첫 컷을 등록해보세요</p>
          )}
        </div>
      )}

      {/* 컷 갤러리 */}
      {filteredCuts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredCuts.map((cut) => (
            <CutCard
              key={cut.id}
              cut={cut}
              onClick={() => setLightboxCut(cut)}
            />
          ))}
        </div>
      )}

      {/* 업로드 모달 */}
      {showUpload && (
        <UploadCutModal
          webtoonId={id}
          existingTags={allTags}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            fetchData();
          }}
        />
      )}

      {/* 라이트박스 */}
      {lightboxCut && (
        <Lightbox
          cut={lightboxCut}
          onClose={() => setLightboxCut(null)}
          onPrev={() => {
            const idx = filteredCuts.findIndex((c) => c.id === lightboxCut.id);
            if (idx > 0) setLightboxCut(filteredCuts[idx - 1]);
          }}
          onNext={() => {
            const idx = filteredCuts.findIndex((c) => c.id === lightboxCut.id);
            if (idx < filteredCuts.length - 1) setLightboxCut(filteredCuts[idx + 1]);
          }}
          hasPrev={filteredCuts.findIndex((c) => c.id === lightboxCut.id) > 0}
          hasNext={
            filteredCuts.findIndex((c) => c.id === lightboxCut.id) <
            filteredCuts.length - 1
          }
        />
      )}
    </div>
  );
}
