import { useState, useRef, useEffect } from "react";
import { Volume2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FlashCardProps {
  id: string;
  front: {
    text: string;
    image?: string;
    audio?: string;
    additionalInfo?: string;
  };
  back: {
    text: string;
    image?: string;
    audio?: string;
    additionalInfo?: string;
  };
  onCardFlip?: (id: string, isFlipped: boolean) => void;
  className?: string;
}

const FlashCard = ({
  id,
  front,
  back,
  onCardFlip,
  className
}: FlashCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [height, setHeight] = useState("auto");
  const [showFrontInfo, setShowFrontInfo] = useState(false);
  const [showBackInfo, setShowBackInfo] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (frontRef.current && backRef.current) {
      setHeight(
        Math.max(
          frontRef.current.scrollHeight,
          backRef.current.scrollHeight
        ) + "px"
      );
    }
  }, [front, back, showFrontInfo, showBackInfo]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onCardFlip) {
      onCardFlip(id, !isFlipped);
    }
  };

  const playAudio = (audioSrc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const toggleInfo = (side: 'front' | 'back', e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === 'front') {
      setShowFrontInfo(!showFrontInfo);
    } else {
      setShowBackInfo(!showBackInfo);
    }
  };

  return (
    <div 
      className={cn(
        "flashcard w-full cursor-pointer perspective-1000",
        isFlipped ? "flipped" : "",
        className
      )}
      style={{ height }}
      onClick={handleFlip}
    >
      <div className="flashcard-inner w-full h-full relative shadow-sm">
        <div 
          ref={frontRef}
          className="flashcard-front bg-purple-100 dark:bg-purple-900/30 rounded-md p-3 flex flex-col items-center justify-center text-center border border-purple-200 dark:border-purple-800/60"
        >
          {front.image && (
            <div className="w-full aspect-[4/3] overflow-hidden rounded-md mb-2">
              <img
                src={front.image}
                alt="Front side"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-base font-medium text-center text-primary dark:text-primary-foreground">
            {front.text}
          </div>
          
          {front.additionalInfo && (
            <div className={`w-full overflow-hidden transition-all duration-300 ${showFrontInfo ? 'max-h-24' : 'max-h-0'}`}>
              <div className="p-2 mt-2 bg-purple-50 dark:bg-purple-950/50 rounded-md text-xs">
                {front.additionalInfo}
              </div>
            </div>
          )}

          <div className="absolute bottom-1 right-1 flex gap-1">
            {front.additionalInfo && (
              <Button
                onClick={(e) => toggleInfo('front', e)}
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700",
                  showFrontInfo && "bg-purple-200 dark:bg-purple-800"
                )}
              >
                <Info className="h-3 w-3" />
              </Button>
            )}
            
            {front.audio && (
              <Button
                onClick={(e) => playAudio(front.audio!, e)}
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div 
          ref={backRef}
          className="flashcard-back bg-purple-100 dark:bg-purple-900/30 rounded-md p-3 flex flex-col items-center justify-center text-center border border-purple-200 dark:border-purple-800/60"
        >
          {back.image && (
            <div className="w-full aspect-[4/3] overflow-hidden rounded-md mb-2">
              <img
                src={back.image}
                alt="Back side"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-base font-medium text-center text-primary dark:text-primary-foreground">
            {back.text}
          </div>
          
          {back.additionalInfo && (
            <div className={`w-full overflow-hidden transition-all duration-300 ${showBackInfo ? 'max-h-24' : 'max-h-0'}`}>
              <div className="p-2 mt-2 bg-purple-50 dark:bg-purple-950/50 rounded-md text-xs">
                {back.additionalInfo}
              </div>
            </div>
          )}

          <div className="absolute bottom-1 right-1 flex gap-1">
            {back.additionalInfo && (
              <Button
                onClick={(e) => toggleInfo('back', e)}
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700",
                  showBackInfo && "bg-purple-200 dark:bg-purple-800"
                )}
              >
                <Info className="h-3 w-3" />
              </Button>
            )}
            
            {back.audio && (
              <Button
                onClick={(e) => playAudio(back.audio!, e)}
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
      
      <style>
        {`
        .flashcard {
          transition: transform 0.3s;
          aspect-ratio: 0.65; /* Aspect ratio légèrement ajusté */
          min-height: 180px; /* Hauteur minimale réduite pour mobile */
        }
        
        @media (max-width: 640px) {
          .flashcard {
            min-height: 160px; /* Encore plus petit sur très petits écrans */
          }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .flashcard.flipped .flashcard-inner {
          transform: rotateY(180deg);
        }
        
        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transition: all 0.3s ease;
          padding: min(3%, 0.75rem); /* Padding adaptatif */
          font-size: 0.9rem; /* Police légèrement réduite */
        }
        
        @media (max-width: 640px) {
          .flashcard-front,
          .flashcard-back {
            font-size: 0.85rem; /* Police encore plus réduite sur petits écrans */
          }
        }
        
        .flashcard-back {
          transform: rotateY(180deg);
        }
        `}
      </style>
    </div>
  );
};

export default FlashCard;
