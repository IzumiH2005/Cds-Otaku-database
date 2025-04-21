
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
    <Card className="overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[1.2/1] relative">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-3xl">📚</span>
          </div>
        )}
        
        {isPublic && (
          <div className="absolute top-1 right-1 bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
            Public
          </div>
        )}
        
        {isShared && (
          <div className="absolute top-1 left-1 bg-blue-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            Importé
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow p-3">
        <h3 className="text-base font-semibold mb-0.5 line-clamp-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {description || "Pas de description"}
        </p>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && 
              <span className="text-[10px] text-muted-foreground">+{tags.length - 2}</span>
            }
          </div>
        )}
        
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{author}</span>
          <span>{cardCount} carte{cardCount !== 1 ? "s" : ""}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 pt-0">
        <Button asChild variant="default" size="sm" className="w-full text-xs h-8">
          <Link to={`/deck/${id}`}>
            Explorer
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeckCard;
