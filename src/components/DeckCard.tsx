
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
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="aspect-video relative">
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
          <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full">
            Public
          </div>
        )}
        
        {isShared && (
          <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full">
            Importé
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow pt-4">
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {description || "Pas de description"}
        </p>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{author}</span>
          <span>{cardCount} carte{cardCount !== 1 ? "s" : ""}</span>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild variant="default" className="w-full">
          <Link to={`/deck/${id}`}>
            Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeckCard;
