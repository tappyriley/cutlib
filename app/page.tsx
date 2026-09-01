"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Webtoon } from "@/types";
import AddWebtoonModal from "@/components/AddWebtoonModal";

export default function HomePage() {
  const [webtoons, setWebtoons] = useState<Webtoon[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchWebtoons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("webtoons")
      .select("*, cuts(count)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: Webtoon[] = data.map((w: any) => ({
        ...w,
        cut_count: w.cuts?.[0]?.count ?? 0,
      }));
      setWebtoons(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWebtoons();
  }, [fetchWebtoons]);

  const filtered = webtoons.filter((w) =>
    w.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">작품 목록</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {webtoons.length}개 작품 · 이벤트 컷 아카이브
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <span className="text-base leading-none">+</span>
          작품 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="작품명으로 검색…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-surface-2" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-surface-2 rounded w-3/4" />
                <div className="h-3 bg-surface-2 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 작품 그리드 */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-24 text-ink-faint">
          {search ? (
            <p className="text-sm">"{search}"에 해당하는 작품이 없어요</p>
          ) : (
            <div className="space-y-2">
              <p className="text-4xl">📚</p>
              <p className="text-sm font-medium text-ink-muted">아직 등록된 작품이 없어요</p>
              <p className="text-xs">위의 "작품 추가" 버튼으로 첫 작품을 등록해보세요</p>
            </div>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((webtoon) => (
            <a
              key={webtoon.id}
              href={`/webtoon/${webtoon.id}`}
              className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-accent/40 transition-all duration-200"
            >
              {/* 썸네일 */}
              <div className="aspect-[3/4] bg-surface-2 overflow-hidden relative">
                {webtoon.thumbnail_url ? (
                  <img
                    src={webtoon.thumbnail_url}
                    alt={webtoon.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl opacity-30">📖</span>
                  </div>
                )}
                {/* 컷 수 뱃지 */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {webtoon.cut_count ?? 0}컷
                </div>
              </div>
              {/* 정보 */}
              <div className="p-3">
                <p className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                  {webtoon.title}
                </p>
                <p className="text-xs text-ink-faint mt-1">{webtoon.registered_by}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {showAdd && (
        <AddWebtoonModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            fetchWebtoons();
          }}
        />
      )}
    </div>
  );
}
