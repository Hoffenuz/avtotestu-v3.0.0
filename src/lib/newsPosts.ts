import type { Language } from '@/contexts/LanguageContext';

export interface NewsPost {
  id: string;
  slug: string;
  title_uz_lat: string;
  title_uz_cyr: string | null;
  title_ru: string | null;
  excerpt_uz_lat: string | null;
  excerpt_uz_cyr: string | null;
  excerpt_ru: string | null;
  body_uz_lat: string;
  body_uz_cyr: string | null;
  body_ru: string | null;
  cover_image_url: string | null;
  meta_description_uz_lat: string | null;
  meta_description_uz_cyr: string | null;
  meta_description_ru: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

type LocalizedFields = {
  title: string;
  excerpt: string;
  body: string;
  metaDescription: string;
};

export function getNewsLocalized(post: NewsPost, language: Language): LocalizedFields {
  if (language === 'ru') {
    return {
      title: post.title_ru || post.title_uz_lat,
      excerpt: post.excerpt_ru || post.excerpt_uz_lat || '',
      body: post.body_ru || post.body_uz_lat,
      metaDescription: post.meta_description_ru || post.meta_description_uz_lat || post.excerpt_uz_lat || '',
    };
  }

  if (language === 'uz') {
    return {
      title: post.title_uz_cyr || post.title_uz_lat,
      excerpt: post.excerpt_uz_cyr || post.excerpt_uz_lat || '',
      body: post.body_uz_cyr || post.body_uz_lat,
      metaDescription: post.meta_description_uz_cyr || post.meta_description_uz_lat || post.excerpt_uz_lat || '',
    };
  }

  return {
    title: post.title_uz_lat,
    excerpt: post.excerpt_uz_lat || '',
    body: post.body_uz_lat,
    metaDescription: post.meta_description_uz_lat || post.excerpt_uz_lat || '',
  };
}

export function formatNewsDate(iso: string | null, language: Language): string {
  if (!iso) return '';
  const locale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'uz-UZ';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}
