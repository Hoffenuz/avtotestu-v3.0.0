import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function DeviceLicenseInstructions({ className }: Props) {
  return (
    <div className={cn("p-4 rounded-xl bg-muted/40 border border-border", className)}>
      <p className="text-sm font-medium text-foreground mb-2">Kalit olish tartibi</p>
      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
        <li>
          Desktop ilovani oching va <b>Aktivatsiya</b> sahifasidagi <b>Qurilma ID</b> ni nusxalang
        </li>
        <li>
          <Link to="/profile" className="text-primary hover:underline font-medium">
            Profil
          </Link>{" "}
          bo&apos;limiga kiring, Qurilma ID ni yozing va <b>Litsenziya olish</b> tugmasini bosing
        </li>
        <li>Chiqgan kalitni nusxalab, desktop ilovaga kiriting</li>
        <li>
          <b>Bir marta beriladi</b> — keyin boshqa qurilmaga o&apos;zgartirib bo&apos;lmaydi
        </li>
      </ol>
    </div>
  );
}
