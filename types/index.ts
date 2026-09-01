export interface Webtoon {
  id: string;
  title: string;
  thumbnail_url: string | null;
  registered_by: string;
  created_at: string;
  cut_count?: number;
}

export interface Cut {
  id: string;
  webtoon_id: string;
  image_url: string;
  episode: number | null;
  tags: string[];
  memo: string | null;
  uploader_name: string;
  created_at: string;
}
