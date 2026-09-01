"use client";

import { useEffect, useState } from "react";
import { picks, downloadImage } from "@/lib/supabase";
import type { Cut } from "@/types";

interface Props {
  cut: Cut;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function Lightbox({ cut, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  const [isPicked, setIsPicked] = useState(false);

  useEffect(() => {
    setIsPicked(picks.has(cut.id));
  }, [cut.id]);

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const togglePick = () => {
    const next = picks.toggle(cut.id);
    setIsPicked(next);
  };

  const download = () => {
    const tag = cut.tags[0] ? `_${cut.tags[0]}` : "";
    const ep = cut.episode ? `_${cut.episode}화` : "";
    const filename = `컷${ep}${tag}.jpg`;
    downloadImage(cut.image_url, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />

      {/* 좌우 네비게이션 */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          ←
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          →
        </button>
      )}

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center md:items-start max-w-5xl w-full mx-4 animate-scale-in">
        {/* 이미지 */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={cut.image_url}
            alt="컷"
            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* 사이드 패널 */}
        <div className="bg-white rounded-xl shadow-xl p-5 w-full md:w-64 shrink-0 space-y-4">
          {/* 닫기 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              컷 정보
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-2 text-ink-faint transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* 화수 */}
          {cut.episode && (
            <div>
              <p className="text-xs text-ink-faint mb-0.5">화수</p>
              <p className="text-sm font-semibold text-ink">{cut.episode}화</p>
            </div>
          )}

          {/* 업로더 */}
          <div>
            <p className="text-xs text-ink-faint mb-0.5">업로더</p>
            <p className="text-sm font-medium text-ink">{cut.uploader_name}</p>
          </div>

          {/* 태그 */}
          {cut.tags.length > 0 && (
            <div>
              <p className="text-xs text-ink-faint mb-1.5">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {cut.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-surface-2 text-ink-muted px-2 py-0.5 rounded-full font-medium border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          {cut.memo && (
            <div>
              <p className="text-xs text-ink-faint mb-0.5">메모</p>
              <p className="text-sm text-ink-muted leading-relaxed">{cut.memo}</p>
            </div>
          )}

          {/* 액션 */}
          <div className="space-y-2 pt-1">
            <button
              onClick={togglePick}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                isPicked
                  ? "bg-accent text-white hover:bg-accent-hover"
                  : "bg-surface-2 text-ink-muted hover:bg-border"
              }`}
            >
              {isPicked ? "♥ 픽됨" : "♡ 픽"}
            </button>
            <button
              onClick={download}
              className="w-full py-2 rounded-lg text-sm font-medium bg-surface-2 text-ink-muted hover:bg-border transition-colors flex items-center justify-center gap-2"
            >
              ↓ 다운로드
            </button>
          </div>

          <p className="text-xs text-ink-faint text-center pt-1">
            ← → 키로 이동 · Esc로 닫기
          </p>
        </div>
      </div>
    </div>
  );
}
