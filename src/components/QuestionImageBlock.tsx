interface QuestionImageBlockProps {
  src: string;
  alt?: string;
  onZoom: () => void;
  /** Mobile: stacked above answers. Desktop: side column. */
  layout: "mobile" | "desktop";
}

/**
 * Question illustration with size limits so square / tall images fit on screen.
 * Full size available via lightbox on click.
 */
const HAS_IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

export function QuestionImageBlock({
  src,
  alt = "Question illustration",
  onZoom,
  layout,
}: QuestionImageBlockProps) {
  const imgClass =
    layout === "mobile"
      ? "mx-auto block w-auto max-w-full max-h-52 sm:max-h-56 object-contain rounded"
      : "mx-auto block w-auto max-w-full max-h-64 lg:max-h-72 object-contain rounded";

  const buttonClass =
    "flex w-full justify-center cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded";

  if (HAS_IMAGE_EXT.test(src)) {
    return (
      <button type="button" className={buttonClass} onClick={onZoom}>
        <img src={src} alt={alt} className={imgClass} loading="lazy" decoding="async" />
      </button>
    );
  }

  return (
    <button type="button" className={buttonClass} onClick={onZoom}>
      <picture>
        <source srcSet={`${src}.png`} type="image/png" />
        <source srcSet={`${src}.jpg`} type="image/jpeg" />
        <source srcSet={`${src}.jpeg`} type="image/jpeg" />
        <img src={`${src}.png`} alt={alt} className={imgClass} loading="lazy" decoding="async" />
      </picture>
    </button>
  );
}
