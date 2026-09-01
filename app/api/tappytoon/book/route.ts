import { NextRequest, NextResponse } from "next/server";

function extractMeta(html: string, property: string) {
  const match = html.match(
    new RegExp(`<meta property="${property}" content="([^"]*)"`)
  );
  return match ? match[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"') : null;
}

function cleanTitle(raw: string | null) {
  if (!raw) return null;
  return raw
    .replace(/\s*\|\s*Tappytoon\s*$/i, "")
    .replace(/\s*-\s*Official\s+\w+\s*$/i, "")
    .trim();
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.tappytoon.com/en/book/${slug}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("작품 정보를 불러오지 못했어요");
    const html = await res.text();

    const title = cleanTitle(extractMeta(html, "og:title"));
    const thumbnailUrl = extractMeta(html, "og:image");

    if (!title) throw new Error("작품 정보를 찾을 수 없어요");

    return NextResponse.json({ title, thumbnailUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "조회에 실패했어요" }, { status: 500 });
  }
}
