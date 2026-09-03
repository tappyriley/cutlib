import { NextRequest, NextResponse } from "next/server";
import {
  fetchBookMeta,
  fetchCatalog,
  rankSlugs,
  slugToTitle,
  type SearchResult,
} from "@/lib/tappytoon";

// 결과마다 작품 페이지를 한 번씩 받아오므로 개수를 적게 유지합니다.
const RESULT_LIMIT = 8;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  if (!q) return NextResponse.json({ results: [] });

  try {
    const slugs = await fetchCatalog();
    const ranked = rankSlugs(slugs, q, RESULT_LIMIT);

    // 메타데이터를 못 가져온 항목도 슬러그 기반 제목으로 노출합니다.
    const settled = await Promise.allSettled(ranked.map((slug) => fetchBookMeta(slug)));
    const results: SearchResult[] = ranked.map((slug, i) => {
      const outcome = settled[i];
      return outcome.status === "fulfilled"
        ? { slug, ...outcome.value }
        : { slug, title: slugToTitle(slug), thumbnailUrl: null };
    });

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "검색에 실패했어요" },
      { status: 500 }
    );
  }
}
