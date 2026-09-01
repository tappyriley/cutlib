-- =============================================
-- 컷 아카이브 라이브러리 — Supabase 스키마
-- Supabase > SQL Editor 에 그대로 붙여넣고 실행하세요
-- =============================================

-- 1. 작품(웹툰) 테이블
create table if not exists webtoons (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  thumbnail_url text,
  registered_by text,
  created_at   timestamptz default now() not null
);

alter table webtoons alter column registered_by drop not null;

-- 2. 컷 테이블
create table if not exists cuts (
  id            uuid default gen_random_uuid() primary key,
  webtoon_id    uuid references webtoons(id) on delete cascade not null,
  image_url     text not null,
  episode       integer,
  tags          text[] default '{}',
  memo          text,
  uploader_name text,
  created_at    timestamptz default now() not null
);

alter table cuts alter column uploader_name drop not null;

-- 3. 인덱스 (검색 성능)
create index if not exists cuts_webtoon_id_idx on cuts(webtoon_id);
create index if not exists cuts_created_at_idx on cuts(created_at desc);

-- 4. RLS (Row Level Security) — 링크 공유 방식, 누구나 읽기/쓰기 가능
alter table webtoons enable row level security;
alter table cuts     enable row level security;

drop policy if exists "public_all_webtoons" on webtoons;
drop policy if exists "public_all_cuts" on cuts;

create policy "public_all_webtoons" on webtoons for all using (true) with check (true);
create policy "public_all_cuts"     on cuts     for all using (true) with check (true);

-- =============================================
-- Storage 버킷은 Supabase 대시보드에서 직접 만드세요:
--   Storage > New bucket > "webtoon-thumbnails" (Public 체크)
--   Storage > New bucket > "cut-images"         (Public 체크)
--
-- ⚠️ "Public" 체크는 읽기(공개 URL) 권한만 부여합니다.
-- 업로드(insert)를 허용하려면 storage.objects 에도 정책이 필요합니다:
-- =============================================

drop policy if exists "public_insert_webtoon_thumbnails" on storage.objects;
drop policy if exists "public_insert_cut_images" on storage.objects;
drop policy if exists "public_read_webtoon_thumbnails" on storage.objects;
drop policy if exists "public_read_cut_images" on storage.objects;

create policy "public_insert_webtoon_thumbnails" on storage.objects
  for insert to public with check (bucket_id = 'webtoon-thumbnails');
create policy "public_insert_cut_images" on storage.objects
  for insert to public with check (bucket_id = 'cut-images');
create policy "public_read_webtoon_thumbnails" on storage.objects
  for select to public using (bucket_id = 'webtoon-thumbnails');
create policy "public_read_cut_images" on storage.objects
  for select to public using (bucket_id = 'cut-images');
