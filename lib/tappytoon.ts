// Tappytoon 공개 데이터에서 작품 목록과 메타데이터를 가져옵니다.
// - 작품 목록: 검색엔진용 공개 사이트맵
// - 제목/표지: 각 작품 페이지의 og: 메타태그
//
// 작품 페이지는 366KB쯤 되지만 og: 태그는 앞부분 10KB 안에 있습니다. 그래서
// 응답 스트림을 앞에서부터 읽다가 태그를 찾으면 끊습니다. 서버가 Range 요청은
// 무시하므로 이 방법밖에 없고, 실제 절약량은 청크 크기에 따라 달라집니다.

const SITEMAP_URL = "https://www.tappytoon.com/sitemap-series.xml";
const BOOK_URL = (slug: string) => `https://www.tappytoon.com/en/book/${slug}`;

const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
const META_READ_LIMIT_BYTES = 64 * 1024;

export interface BookMeta {
  title: string;
  thumbnailUrl: string | null;
}

export interface SearchResult extends BookMeta {
  slug: string;
}

// 워밍된 서버 인스턴스 안에서만 유지되는 캐시입니다.
// 콜드 스타트 때는 비어 있고, 카탈로그가 약 1,500개라 무한정 커지지 않습니다.
let catalogCache: { slugs: string[]; fetchedAt: number } | null = null;
const metaCache = new Map<string, BookMeta>();

export function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function cleanTitle(raw: string) {
  return raw
    .replace(/\s*\|\s*Tappytoon\s*$/i, "")
    .replace(/\s*-\s*Official\s+\w+\s*$/i, "")
    .trim();
}

function extractMeta(html: string, property: string) {
  const match = html.match(
    new RegExp(`<meta property="${property}" content="([^"]*)"`)
  );
  return match ? match[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"') : null;
}

export async function fetchCatalog(): Promise<string[]> {
  if (catalogCache && Date.now() - catalogCache.fetchedAt < CATALOG_TTL_MS) {
    return catalogCache.slugs;
  }

  const res = await fetch(SITEMAP_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("사이트맵을 불러오지 못했어요");

  const xml = await res.text();
  const slugs = Array.from(xml.matchAll(/\/en\/book\/([a-z0-9-]+)</g)).map(
    (m) => m[1]
  );
  const unique = Array.from(new Set(slugs));

  catalogCache = { slugs: unique, fetchedAt: Date.now() };
  return unique;
}

// 작품 페이지의 앞부분만 읽어옵니다. og: 태그를 다 찾았거나 </head>에
// 닿으면 즉시 스트림을 끊습니다.
async function fetchPageHead(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok || !res.body) throw new Error("작품 페이지를 불러오지 못했어요");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let received = 0;

  try {
    while (received < META_READ_LIMIT_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;

      received += value.length;
      html += decoder.decode(value, { stream: true });

      if (html.includes("</head>")) break;
      if (html.includes('property="og:title"') && html.includes('property="og:image"')) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return html;
}

export async function fetchBookMeta(slug: string): Promise<BookMeta> {
  const cached = metaCache.get(slug);
  if (cached) return cached;

  const html = await fetchPageHead(BOOK_URL(slug));
  const rawTitle = extractMeta(html, "og:title");
  if (!rawTitle) throw new Error("작품 정보를 찾을 수 없어요");

  const meta: BookMeta = {
    title: cleanTitle(rawTitle) || slugToTitle(slug),
    thumbnailUrl: extractMeta(html, "og:image"),
  };

  metaCache.set(slug, meta);
  return meta;
}

// 슬러그를 검색어와 비교해 점수를 매깁니다. 낮을수록 정확한 매칭이고,
// null이면 매칭되지 않은 것입니다. 인덱스가 없어 실제 제목이 아닌
// 슬러그 기준으로 채점하지만, 사이트맵 순서로 자르는 것보다는 훨씬 낫습니다.
function scoreSlug(slug: string, query: string, tokens: string[]): number | null {
  const haystack = slug.replace(/-/g, " ");

  if (haystack === query) return 0;
  if (haystack.startsWith(query)) return 1;
  if (haystack.includes(query)) return 2;
  if (tokens.every((t) => haystack.includes(t))) return 3;
  return null;
}

export function rankSlugs(slugs: string[], query: string, limit: number): string[] {
  const tokens = query.split(/\s+/).filter(Boolean);

  return slugs
    .map((slug) => ({ slug, score: scoreSlug(slug, query, tokens) }))
    .filter((hit): hit is { slug: string; score: number } => hit.score !== null)
    .sort((a, b) => a.score - b.score || a.slug.length - b.slug.length || a.slug.localeCompare(b.slug))
    .slice(0, limit)
    .map((hit) => hit.slug);
}
