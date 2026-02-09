import { Card } from "@/components/ui/card";

interface QuestionImageProps {
  imageUrl: string;
  altText: string;
}

export const QuestionImage = ({ imageUrl, altText }: QuestionImageProps) => {
  return (
    <Card className="w-full max-w-md bg-card border-image-border shadow-sm overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    </Card>
  );
};