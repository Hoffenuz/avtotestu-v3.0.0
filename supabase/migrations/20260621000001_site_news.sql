-- ============================================================
-- Site news / yangiliklar for public SEO pages
-- ============================================================

CREATE TABLE IF NOT EXISTS public.news_posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL,
  title_uz_lat    TEXT        NOT NULL CHECK (char_length(trim(title_uz_lat)) BETWEEN 3 AND 200),
  title_uz_cyr    TEXT        CHECK (title_uz_cyr IS NULL OR char_length(trim(title_uz_cyr)) BETWEEN 3 AND 200),
  title_ru        TEXT        CHECK (title_ru IS NULL OR char_length(trim(title_ru)) BETWEEN 3 AND 200),
  excerpt_uz_lat  TEXT        CHECK (excerpt_uz_lat IS NULL OR char_length(excerpt_uz_lat) <= 500),
  excerpt_uz_cyr  TEXT        CHECK (excerpt_uz_cyr IS NULL OR char_length(excerpt_uz_cyr) <= 500),
  excerpt_ru      TEXT        CHECK (excerpt_ru IS NULL OR char_length(excerpt_ru) <= 500),
  body_uz_lat     TEXT        NOT NULL CHECK (char_length(trim(body_uz_lat)) >= 20),
  body_uz_cyr     TEXT        CHECK (body_uz_cyr IS NULL OR char_length(body_uz_cyr) >= 20),
  body_ru         TEXT        CHECK (body_ru IS NULL OR char_length(body_ru) >= 20),
  cover_image_url TEXT        CHECK (cover_image_url IS NULL OR char_length(cover_image_url) <= 500),
  meta_description_uz_lat TEXT CHECK (meta_description_uz_lat IS NULL OR char_length(meta_description_uz_lat) <= 320),
  meta_description_uz_cyr TEXT CHECK (meta_description_uz_cyr IS NULL OR char_length(meta_description_uz_cyr) <= 320),
  meta_description_ru     TEXT CHECK (meta_description_ru IS NULL OR char_length(meta_description_ru) <= 320),
  is_published    BOOLEAN     NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT news_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT news_posts_slug_len CHECK (char_length(slug) BETWEEN 3 AND 120),
  CONSTRAINT news_posts_publish_consistency CHECK (
    (is_published = false)
    OR (is_published = true AND published_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_posts_slug ON public.news_posts (slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts (published_at DESC)
  WHERE is_published = true;

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.news_posts TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read published news" ON public.news_posts;
CREATE POLICY "Public can read published news"
  ON public.news_posts FOR SELECT
  USING (
    is_published = true
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

DROP POLICY IF EXISTS "Admins manage news posts" ON public.news_posts;
CREATE POLICY "Admins manage news posts"
  ON public.news_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_news_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_news_posts_updated_at ON public.news_posts;
CREATE TRIGGER trg_touch_news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_news_posts_updated_at();

-- Starter post (admin can edit in Supabase Table Editor)
INSERT INTO public.news_posts (
  slug,
  title_uz_lat,
  title_uz_cyr,
  title_ru,
  excerpt_uz_lat,
  excerpt_uz_cyr,
  excerpt_ru,
  body_uz_lat,
  body_uz_cyr,
  body_ru,
  meta_description_uz_lat,
  meta_description_uz_cyr,
  meta_description_ru,
  is_published,
  published_at
) VALUES (
  'avtotestlar-yangiliklar-bo-limi-ochildi',
  'Avtotestlar.uz yangiliklar bo''limi ishga tushdi',
  'Avtotestlar.uz yangiliklar bo''limi ishga tushdi',
  'Запущен раздел новостей Avtotestlar.uz',
  'YHQ testlari, PRO obuna va platforma yangilanishlari haqida rasmiy e''lonlar shu yerda e''lon qilinadi.',
  'YHQ testlari, PRO obuna va platforma yangilanishlari haqida rasmiy e''lonlar shu yerda e''lon qilinadi.',
  'Официальные объявления о тестах ПДД, PRO-подписке и обновлениях платформы.',
  'Salom! Avtotestlar.uz saytida yangiliklar bo''limi ochildi. Bu yerda biz sizga quyidagilar haqida xabar beramiz: yangi test savollari va variantlar, PRO obuna yangilanishlari, video darslik va mavzuli testlar bo''yicha yangiliklar, hamda haydovchilik guvohnomasi imtihoniga tayyorgarlik bo''yicha foydali maslahatlar.

Telegram kanalimiz ham faol — lekin endi barcha muhim e''lonlar saytda ham saqlanadi va Google qidiruvida topish osonroq.',
  'Salom! Avtotestlar.uz saytida yangiliklar bo''limi ochildi.',
  'Привет! На сайте Avtotestlar.uz открыт раздел новостей.',
  'Avtotestlar.uz yangiliklar: YHQ testlari, PRO obuna va platforma yangilanishlari.',
  'Avtotestlar.uz yangiliklar: YHQ testlari va platforma yangilanishlari.',
  'Новости Avtotestlar.uz: тесты ПДД, PRO-подписка и обновления платформы.',
  true,
  now()
) ON CONFLICT (slug) DO NOTHING;
