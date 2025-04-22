
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export interface DeckCardProps {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  author: string;
  cardCount: number;
  isPublic: boolean;
  isShared?: boolean;
}

const DeckCard = ({
  id,
  title,
  description,
  coverImage,
  tags,
  author,
  cardCount,
  isPublic,
  isShared
}: DeckCardProps) => {
  return (
    <Card className="overflow-hidden flex flex-col h-full border-0 shadow-none w-full">
      <div className="aspect-[4/5] relative">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title} 
            className="w-full h-full object-cover"
            loading="lazy" // Optimisation pour mobile
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-xl">📚</span>
          </div>
        )}
        
        {isPublic && (
          <div className="absolute top-0 right-0 bg-black/70 text-white text-[8px] px-1.5 py-0.5">
            Public
          </div>
        )}
        
        {isShared && (
          <div className="absolute top-0 left-0 bg-blue-500/70 text-white text-[8px] px-1.5 py-0.5">
            Importé
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow p-1.5 pt-1">
        <h3 className="text-[11px] font-semibold mb-0.5 truncate uppercase">{title}</h3>
        <p className="text-[9px] text-muted-foreground mb-1 line-clamp-1">
          {description || "Pas de description"}
        </p>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mb-1">
            {tags.slice(0, 1).map((tag, index) => (
              <span
                key={index}
                className="text-[8px] bg-secondary text-secondary-foreground px-1 py-0 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 1 && 
              <span className="text-[8px] text-muted-foreground">+{tags.length - 1}</span>
            }
          </div>
        )}
        
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span className="truncate max-w-[60%]">{author}</span>
          <span>{cardCount} carte{cardCount !== 1 ? "s" : ""}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-1.5 pt-0">
        <Button asChild variant="default" className="w-full text-[10px] h-6 px-0 rounded-md bg-black hover:bg-black/90">
          <Link to={`/deck/${id}`} className="flex justify-between items-center px-2">
            <span>Explorer</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeckCard;
