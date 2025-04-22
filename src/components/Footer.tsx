
import { Heart } from "lucide-react";

const Footer = () => {
  // On mobile, display a minimal footer as requested
  return (
    <footer className="app-footer border-t bg-background/50 py-3">
      <div className="container mx-auto px-3">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>CDS FLASHCARD-BASE</span>
            <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
            <span>2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
