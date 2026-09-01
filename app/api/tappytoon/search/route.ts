import { NextRequest, NextResponse } from "next/server";

const SITEMAP_URL = "https://www.tappytoon.com/sitemap-series.xml";

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchCatalog() {
  const res = await fetch(SITEMAP_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("사이트맵을 불러오지 못했어요");
  const xml = await res.text();
  const slugs = Array.from(xml.matchAll(/\/en\/book\/([a-z0-9-]+)</g)).map((m) => m[1]);
  return Array.from(new Set(slugs));
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  if (!q) return NextResponse.json({ results: [] });

  try {
    const slugs = await fetchCatalog();
    const queryTokens = q.split(/\s+/);

    const results = slugs
      .filter((slug) => {
        const haystack = slug.replace(/-/g, " ");
        return queryTokens.every((t) => haystack.includes(t));
      })
      .slice(0, 20)
      .map((slug) => ({ slug, title: slugToTitle(slug) }));

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "검색에 실패했어요" }, { status: 500 });
  }
}
