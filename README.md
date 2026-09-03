# 컷 아카이브 (cutlib)

Tappytoon 이벤트 컷을 작품별로 모아두고, 태그로 찾고, 바로 내려받을 수 있는 사내용 컷 라이브러리입니다. 계정/로그인 없이 링크만 공유하면 팀원 누구나 바로 쓸 수 있습니다.

## 주요 기능

**작품 목록 (`/`)**
- 작품 카드 그리드 + 작품명 검색
- 작품 추가 — Tappytoon 카탈로그에서 검색해 작품명·표지를 자동으로 채우거나, 직접 입력/이미지 업로드
- 작품 삭제 — 해당 작품의 컷도 함께 삭제됨 (DB cascade)

**작품 상세 (`/webtoon/[id]`)**
- 컷 갤러리 + 태그 필터
- 컷 업로드 — 여러 장 동시 업로드, 화수·태그·메모 입력, 기존 태그 자동완성
- 링크 복사 — 이 작품 페이지 주소를 클립보드로

**컷**
- 라이트박스 — 좌우 화살표 키로 이동, Esc로 닫기
- 픽(즐겨찾기) — 브라우저별로 저장 (localStorage)
- 다운로드 — 클릭 시 새 탭으로 열리지 않고 바로 파일로 저장
- 삭제
- 댓글 — 계정 없이 누구나 작성

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript, React 18 |
| 스타일 | Tailwind CSS |
| DB / 스토리지 | Supabase (Postgres + Storage) |
| 배포 | Vercel |

## 로컬에서 실행하기

Node.js 18 이상이 필요합니다.

```bash
npm install
```

프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 값을 채웁니다. (`.env.local.example` 참고)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx...
```

두 값은 Supabase 대시보드의 Project Settings → API 에서 각각 **Project URL**, **anon public** 키로 확인할 수 있습니다.

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

## Supabase 세팅

처음 세팅하는 경우 [SETUP.md](SETUP.md)에 Supabase 프로젝트 생성부터 Vercel 배포까지 단계별 가이드가 있습니다. 요약하면 두 가지가 필요합니다.

**1. 테이블과 정책 생성**

Supabase 대시보드 → SQL Editor 에서 [supabase/schema.sql](supabase/schema.sql) 전체를 붙여넣고 실행합니다. 이 파일은 몇 번을 다시 실행해도 안전하게 작성되어 있으니, 스키마가 바뀔 때마다 전체를 다시 실행하면 됩니다.

로컬 파일만 수정해도 실제 DB에는 반영되지 않습니다. 스키마를 건드렸다면 SQL Editor에서 다시 실행해야 합니다.

**2. 스토리지 버킷 생성**

Storage → New bucket 으로 아래 두 개를 만들고, 각각 **Public** 으로 체크합니다.

- `webtoon-thumbnails`
- `cut-images`

Public 체크는 읽기 권한만 부여하므로, 업로드가 가능하도록 `storage.objects` 정책도 필요합니다. 해당 정책은 `schema.sql` 하단에 포함되어 있습니다.

## 데이터 구조

| 테이블 | 설명 | 주요 컬럼 |
| --- | --- | --- |
| `webtoons` | 작품 | `title`, `thumbnail_url` |
| `cuts` | 컷 | `webtoon_id`, `image_url`, `episode`, `tags`, `memo` |
| `comments` | 컷 댓글 | `cut_id`, `content` |

`cuts`는 `webtoons`를, `comments`는 `cuts`를 각각 cascade로 참조하므로, 상위 항목을 지우면 하위 항목도 함께 지워집니다.

## 프로젝트 구조

```
app/
  page.tsx                      작품 목록
  webtoon/[id]/page.tsx         작품 상세 (컷 갤러리)
  api/tappytoon/search/route.ts Tappytoon 작품 검색
components/
  AddWebtoonModal.tsx           작품 추가 모달
  UploadCutModal.tsx            컷 업로드 모달
  CutCard.tsx                   컷 카드
  Lightbox.tsx                  컷 상세 뷰어 + 댓글
lib/supabase.ts                 Supabase 클라이언트, 업로드/다운로드 헬퍼, 픽 저장
lib/tappytoon.ts                Tappytoon 카탈로그 · 메타데이터 조회, 검색 랭킹
supabase/schema.sql             테이블 · 인덱스 · RLS 정책
types/index.ts                  공용 타입
```

## Tappytoon 작품 검색

작품 추가 시 쓰이는 검색은 Tappytoon 공식 사이트의 공개 데이터를 이용합니다. 검색엔진용 공개 사이트맵(`sitemap-series.xml`)에서 작품 목록을 받아 검색어와 매칭하고, 상위 결과 각각의 작품 페이지에서 `og:title`·`og:image` 메타태그를 읽어 제목과 표지를 가져옵니다. 그래서 드롭다운에서 표지를 보고 고를 수 있고, 선택하면 추가 요청 없이 바로 채워집니다.

작품 페이지는 366KB쯤 되지만 `og:` 태그는 앞부분 10KB 안에 있습니다. 그래서 페이지 전체를 받지 않고 응답 스트림을 앞에서부터 읽다가 태그를 찾으면 바로 끊습니다. 서버 런타임에서 측정하면 작품당 16KB만 받으며, 6개를 동시에 조회하는 데 약 1초가 걸립니다.

사이트맵(영문 작품 약 1,500개)과 한 번 읽은 작품 메타데이터는 서버 메모리에 캐시하므로, 같은 작품이 다시 검색되면 추가 요청이 없습니다.

표지 이미지는 다시 업로드하지 않고 Tappytoon CDN 주소를 그대로 저장합니다.

**제약**: 공식 사이트가 영문(en/de/fr) 기준이라 검색은 영문 작품명으로만 매칭됩니다. 예를 들어 "레벨업"이 아니라 "solo leveling"으로 검색해야 합니다.

## 배포

`main` 브랜치에 푸시하면 Vercel이 자동으로 프로덕션 배포합니다. Vercel 프로젝트에 위 환경변수 두 개가 등록되어 있어야 합니다.

PR을 올리면 Preview 배포도 생성됩니다. Preview 배포가 계속 실패하는 경우, 환경변수가 Production 환경에만 등록되어 있고 Preview 환경에는 빠져 있는지 확인해 보세요 (Vercel → Settings → Environment Variables).

## 알아두어야 할 점

- **인증이 없습니다.** RLS 정책이 모든 테이블에 대해 누구나 읽기·쓰기·삭제할 수 있도록 열려 있습니다. 링크를 아는 사람은 컷과 작품을 삭제할 수도 있으니, 주소 공유 범위를 팀 내부로 관리해 주세요.
- **픽(즐겨찾기)은 기기별로 저장됩니다.** localStorage를 쓰기 때문에 브라우저를 바꾸거나 데이터를 지우면 사라지고, 팀원 간에 공유되지 않습니다.
- **컷을 삭제해도 스토리지의 이미지 파일은 남습니다.** DB 레코드만 삭제되므로, 저장 용량 정리가 필요하면 Storage에서 직접 지워야 합니다.
