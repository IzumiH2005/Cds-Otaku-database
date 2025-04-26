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
      style={{ minHeight: "400px", height }}
      onClick={handleFlip}
    >
      <div className="flashcard-inner w-full h-full relative shadow-lg">
        <div 
          ref={frontRef}
          className="flashcard-front bg-gradient-to-br from-indigo-500/20 to-purple-600/30 dark:from-indigo-900/50 dark:to-purple-800/40 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center gap-4 border border-indigo-200/60 dark:border-indigo-700/60 shadow-md"
        >
          {front.image && (
            <div className="w-full aspect-[4/3] overflow-hidden rounded-lg mb-4 border border-indigo-200/60 dark:border-indigo-700/60 shadow-md hover:shadow-lg transition-all duration-300">
              <img
                src={front.image}
                alt="Front side"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="text-xl font-medium text-center text-primary dark:text-primary-foreground">
            {front.text}
          </div>
          
          {front.additionalInfo && (
            <div className={`w-full overflow-hidden transition-all duration-300 ${showFrontInfo ? 'max-h-48' : 'max-h-0'}`}>
              <div className="p-3 mt-2 bg-indigo-100/80 dark:bg-indigo-950/50 rounded-lg text-sm border border-indigo-200 dark:border-indigo-800">
                {front.additionalInfo}
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex gap-2">
            {front.additionalInfo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => toggleInfo('front', e)}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 border-indigo-200 dark:border-indigo-700",
                        showFrontInfo && "bg-indigo-200 dark:bg-indigo-800"
                      )}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showFrontInfo ? "Masquer les infos" : "Voir les infos"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {front.audio && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => playAudio(front.audio!, e)}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 border-indigo-200 dark:border-indigo-700"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Écouter l'audio</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div 
          ref={backRef}
          className="flashcard-back bg-gradient-to-br from-purple-500/20 to-pink-600/30 dark:from-purple-900/50 dark:to-pink-800/40 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center gap-4 border border-purple-200/60 dark:border-purple-700/60 shadow-md"
        >
          {back.image && (
            <div className="w-full aspect-[4/3] overflow-hidden rounded-lg mb-4 border border-purple-200/60 dark:border-purple-700/60 shadow-md hover:shadow-lg transition-all duration-300">
              <img
                src={back.image}
                alt="Back side"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="text-xl font-medium text-center text-primary dark:text-primary-foreground">
            {back.text}
          </div>
          
          {back.additionalInfo && (
            <div className={`w-full overflow-hidden transition-all duration-300 ${showBackInfo ? 'max-h-48' : 'max-h-0'}`}>
              <div className="p-3 mt-2 bg-pink-100/80 dark:bg-pink-950/50 rounded-lg text-sm border border-pink-200 dark:border-pink-800">
                {back.additionalInfo}
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex gap-2">
            {back.additionalInfo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => toggleInfo('back', e)}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800 border-pink-200 dark:border-pink-700",
                        showBackInfo && "bg-pink-200 dark:bg-pink-800"
                      )}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showBackInfo ? "Masquer les infos" : "Voir les infos"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {back.audio && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => playAudio(back.audio!, e)}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800 border-pink-200 dark:border-pink-700"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Écouter l'audio</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
      
      <style>
        {`
        .flashcard {
          transition: transform 0.3s;
          min-height: 400px;
          aspect-ratio: 4/3;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s;
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
        }
        
        .flashcard-front:hover,
        .flashcard-back:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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
