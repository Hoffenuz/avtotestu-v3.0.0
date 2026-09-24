import { Helmet } from "react-helmet-async";
import { SEO } from "./SEO";

const BASE_URL = "https://www.avtotestu.uz";
const DEFAULT_OG_IMAGE = `${BASE_URL}/avtosmart-og.jpg`;
/* Google nashriyot logotipini OQ fonda ko'rsatadi — oq variant ko'rinmasdi. */
const PUBLISHER_LOGO = `${BASE_URL}/avtosmart-logo.webp`;

interface ArticleSEOProps {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt?: string;
  ogImage?: string;
  keywords?: string;
}

export function ArticleSEO({
  title,
  description,
  path,
  publishedAt,
  updatedAt,
  ogImage = DEFAULT_OG_IMAGE,
  keywords,
}: ArticleSEOProps) {
  const fullUrl = `${BASE_URL}${path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    image: [ogImage],
    author: {
      "@type": "Organization",
      name: "AvtoSmart",
    },
    publisher: {
      "@type": "Organization",
      name: "AvtoSmart",
      logo: {
        "@type": "ImageObject",
        url: PUBLISHER_LOGO,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": fullUrl,
    },
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        path={path}
        keywords={keywords}
        ogImage={ogImage}
      />
      <Helmet>
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={publishedAt} />
        {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
    </>
  );
}
