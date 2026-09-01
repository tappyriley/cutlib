# 컷 아카이브 — 배포 세팅 가이드

> 총 소요 시간: 약 20~30분 (처음 하는 경우 기준)

---

## 준비물

- GitHub 계정 ✅ (이미 있음)
- 이메일 주소 (Supabase, Vercel 가입용)

---

## STEP 1 — Supabase 프로젝트 만들기

1. https://supabase.com 접속 → **Start your project** (무료)
2. GitHub 계정으로 로그인
3. **New project** 클릭
   - Name: `cutlib` (아무거나 ok)
   - Password: 안전한 비밀번호 입력 (저장해두세요)
   - Region: **Northeast Asia (Tokyo)** 선택
4. 프로젝트 생성 완료까지 1~2분 대기

---

## STEP 2 — DB 테이블 만들기

1. 좌측 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. 이 폴더의 `supabase/schema.sql` 파일 전체 내용을 복붙
4. **Run** 버튼 클릭
5. 초록색 "Success" 메시지 확인

---

## STEP 3 — 이미지 저장소(Storage) 만들기

1. 좌측 메뉴 **Storage** 클릭
2. **New bucket** 클릭
   - Name: `webtoon-thumbnails`
   - **Public bucket** 체크 ✅ → Create
3. 같은 방식으로 **New bucket** 한 번 더
   - Name: `cut-images`
   - **Public bucket** 체크 ✅ → Create

---

## STEP 4 — Supabase 키 복사하기

1. 좌측 메뉴 **Project Settings** → **API** 클릭
2. 다음 두 값을 메모장에 복사해두기:
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public** key: `eyJxxxxxx...` (긴 문자열)

---

## STEP 5 — GitHub에 코드 올리기

1. https://github.com/new 에서 새 repository 만들기
   - Repository name: `cutlib`
   - **Private** 선택 권장 (팀 내부툴)
   - Create repository 클릭

2. 터미널(맥: Terminal 앱, 윈도우: PowerShell)에서:

```bash
# 이 프로젝트 폴더로 이동
cd cutlib

# git 초기화
git init
git add .
git commit -m "initial commit"

# GitHub에 연결 (본인 username으로 변경)
git remote add origin https://github.com/본인username/cutlib.git
git push -u origin main
```

---

## STEP 6 — Vercel에 배포하기

1. https://vercel.com 접속 → GitHub으로 로그인
2. **Add New Project** 클릭
3. `cutlib` repository 선택 → **Import**
4. 환경변수 설정 (STEP 4에서 복사한 값 입력):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJxxxxxx...`
5. **Deploy** 클릭
6. 2~3분 후 배포 완료 → `https://cutlib-xxx.vercel.app` 주소 생성!

---

## STEP 7 — 도메인 연결하기 (선택)

도메인을 구매했다면:

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 구매한 도메인 입력 → **Add**
3. 도메인 구매처(Namecheap 등)에서 DNS 설정
   - Vercel이 안내하는 CNAME 값 입력
4. 10~30분 후 도메인 연결 완료

---

## 이후 수정하고 싶을 때

코드를 수정한 뒤:

```bash
git add .
git commit -m "수정 내용"
git push
```

→ Vercel이 자동으로 감지해서 1~2분 내 재배포 완료!

---

## 문제 생기면?

Claude한테 에러 메시지를 복붙해서 물어보세요 😊
