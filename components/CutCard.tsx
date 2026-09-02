"use client";

import { useState, useEffect } from "react";
import { picks, downloadImage } from "@/lib/supabase";
import type { Cut } from "@/types";

interface Props {
  cut: Cut;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export default function CutCard({ cut, onClick, onDelete }: Props) {
  const [isPicked, setIsPicked] = useState(false);

  useEffect(() => {
    setIsPicked(picks.has(cut.id));
  }, [cut.id]);

  const togglePick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = picks.toggle(cut.id);
    setIsPicked(next);
  };

  const download = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tag = cut.tags[0] ? `_${cut.tags[0]}` : "";
    const ep = cut.episode ? `_${cut.episode}화` : "";
    const filename = `컷${ep}${tag}.jpg`;
    downloadImage(cut.image_url, filename);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(cut.id);
  };

  return (
    <div
      className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-accent/30 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* 이미지 */}
      <div className="aspect-[3/4] bg-surface-2 overflow-hidden relative">
        <img
          src={cut.image_url}
          alt={`${cut.episode ? `${cut.episode}화 ` : ""}컷`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* 화수 뱃지 */}
        {cut.episode && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {cut.episode}화
          </div>
        )}

        {/* 액션 버튼 (호버 시) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 즐겨찾기 */}
          <button
            onClick={togglePick}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isPicked
                ? "bg-accent text-white"
                : "bg-white/90 text-ink-faint hover:text-accent"
            }`}
            title={isPicked ? "픽 해제" : "픽"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill={isPicked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M7 12.5C7 12.5 1 8.5 1 4.5C1 2.567 2.567 1 4.5 1C5.675 1 6.708 1.586 7 2.5C7.292 1.586 8.325 1 9.5 1C11.433 1 13 2.567 13 4.5C13 8.5 7 12.5 7 12.5Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* 다운로드 */}
          <button
            onClick={download}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md text-ink-faint hover:text-accent transition-colors"
            title="다운로드"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v8M4 6l3 3 3-3M1 10v1.5A1.5 1.5 0 002.5 13h9a1.5 1.5 0 001.5-1.5V10"/>
            </svg>
          </button>

          {/* 삭제 */}
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md text-ink-faint hover:text-accent transition-colors"
            title="삭제"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h10M5.5 4V2.5a1 1 0 011-1h1a1 1 0 011 1V4M11 4l-.5 8a1 1 0 01-1 .9h-5a1 1 0 01-1-.9L3 4"/>
            </svg>
          </button>
        </div>

        {/* 픽 인디케이터 (항상 보임) */}
        {isPicked && (
          <div className="absolute bottom-2 left-2">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <path d="M5 9C5 9 1 6 1 3.5C1 2.119 2.119 1 3.5 1C4.262 1 4.93 1.372 5 2C5.07 1.372 5.738 1 6.5 1C7.881 1 9 2.119 9 3.5C9 6 5 9 5 9Z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3 space-y-1.5">
        {/* 태그 */}
        {cut.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cut.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-surface-2 text-ink-muted px-1.5 py-0.5 rounded font-medium"
              >
                #{tag}
              </span>
            ))}
            {cut.tags.length > 3 && (
              <span className="text-xs text-ink-faint">+{cut.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* 메모 */}
        {cut.memo && (
          <p className="text-xs text-ink-muted line-clamp-1">{cut.memo}</p>
        )}

        {/* 업로더 */}
        <p className="text-xs text-ink-faint">{cut.uploader_name}</p>
      </div>
    </div>
  );
}
