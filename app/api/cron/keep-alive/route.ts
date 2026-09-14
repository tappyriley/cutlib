import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Supabase 무료 플랜은 7일간 DB 활동이 없으면 프로젝트를 자동 일시정지합니다.
// Vercel Cron이 이 라우트를 주기적으로 호출해서 가벼운 조회 한 번으로
// "활동"을 만들어 자동 정지를 막습니다. CRON_SECRET을 설정해두면
// Vercel Cron이 아닌 외부 요청은 거부합니다 (설정 안 했으면 검사를 건너뜁니다).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { error } = await supabase.from("webtoons").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
