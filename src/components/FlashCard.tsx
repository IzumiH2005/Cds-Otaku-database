import { useState, useRef, useEffect } from "react";
import { Volume2, Info, Pause, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as indexedDB from "../lib/indexedDB";

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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentPlayingSide, setCurrentPlayingSide] = useState<'front' | 'back' | null>(null);
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

  // Audio déjà chargé depuis IndexedDB et converti en ObjectURL
  const [audioObjectURLs, setAudioObjectURLs] = useState<Record<string, string>>({});
  // États d'erreur pour chaque audio
  const [audioErrors, setAudioErrors] = useState<Record<string, boolean>>({});
  
  // Fonction pour récupérer l'audio depuis IndexedDB
  const getAudioFromIndexedDBIfNeeded = async (audioSrc: string): Promise<string> => {
    // Si c'est déjà un URL d'objet que nous avons généré, le retourner directement
    if (audioObjectURLs[audioSrc]) {
      return audioObjectURLs[audioSrc];
    }
    
    // Si c'est une référence à IndexedDB (préfixe 'indexeddb:')
    if (audioSrc.startsWith('indexeddb:')) {
      try {
        const audioId = audioSrc.replace('indexeddb:', '');
        console.log(`Récupération de l'audio ${audioId} depuis IndexedDB...`);
        
        // Récupérer le contenu audio depuis IndexedDB
        const audioData = await indexedDB.getAudioFromIndexedDB(audioId);
        
        if (!audioData) {
          console.error(`Audio ${audioId} non trouvé dans IndexedDB`);
          setAudioErrors(prev => ({ ...prev, [audioSrc]: true }));
          return '';
        }
        
        // Créer un Blob à partir des données base64
        const binaryString = atob(audioData.split(',').pop() || audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Déterminer le type MIME
        const type = audioData.startsWith('data:') 
          ? audioData.split(';')[0].split(':')[1] 
          : 'audio/mpeg'; // Par défaut si non spécifié
        
        const blob = new Blob([bytes], { type });
        
        // Créer une URL pour le Blob
        const url = URL.createObjectURL(blob);
        
        // Conserver l'URL pour une utilisation ultérieure
        setAudioObjectURLs(prev => ({ ...prev, [audioSrc]: url }));
        
        console.log(`Audio ${audioId} récupéré avec succès et converti en URL:`, url);
        return url;
      } catch (error) {
        console.error("Erreur lors de la récupération audio depuis IndexedDB:", error);
        setAudioErrors(prev => ({ ...prev, [audioSrc]: true }));
        return '';
      }
    }
    
    // Si c'est une URL directe ou une chaîne base64, la retourner telle quelle
    return audioSrc;
  };
  
  // Nettoyage des URL d'objets créés
  useEffect(() => {
    return () => {
      // Libérer toutes les URL d'objets lors du démontage du composant
      Object.values(audioObjectURLs).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [audioObjectURLs]);

  const playAudio = async (audioSrc: string, side: 'front' | 'back', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    // Si nous avons déjà détecté une erreur avec cet audio, ne pas réessayer
    if (audioErrors[audioSrc]) {
      console.warn(`Lecture audio ignorée pour ${audioSrc} en raison d'erreurs précédentes`);
      return;
    }
    
    try {
      // Si l'audio est en train de jouer, le mettre en pause
      if (isAudioPlaying && currentPlayingSide === side) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
        setCurrentPlayingSide(null);
        return;
      }
      
      // Récupérer l'URL effective de l'audio (depuis IndexedDB si nécessaire)
      const effectiveAudioSrc = await getAudioFromIndexedDBIfNeeded(audioSrc);
      
      if (!effectiveAudioSrc) {
        console.error("Impossible de récupérer l'audio");
        setAudioErrors(prev => ({ ...prev, [audioSrc]: true }));
        return;
      }
      
      // Charger la nouvelle source et jouer
      audioRef.current.src = effectiveAudioSrc;
      
      // Jouer l'audio
      await audioRef.current.play();
      setIsAudioPlaying(true);
      setCurrentPlayingSide(side);
      
    } catch (error) {
      console.error("Erreur lors de la lecture audio:", error);
      setIsAudioPlaying(false);
      setCurrentPlayingSide(null);
      setAudioErrors(prev => ({ ...prev, [audioSrc]: true }));
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
          className="flashcard-front rounded-md p-3 flex flex-col items-center justify-center text-center"
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
                onClick={(e) => playAudio(front.audio!, 'front', e)}
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700",
                  isAudioPlaying && currentPlayingSide === 'front' && "bg-purple-200 dark:bg-purple-800"
                )}
              >
                {isAudioPlaying && currentPlayingSide === 'front' 
                  ? <Pause className="h-3 w-3" /> 
                  : <Volume2 className="h-3 w-3" />
                }
              </Button>
            )}
          </div>
        </div>
        
        <div 
          ref={backRef}
          className="flashcard-back rounded-md p-3 flex flex-col items-center justify-center text-center"
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
                onClick={(e) => playAudio(back.audio!, 'back', e)}
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700",
                  isAudioPlaying && currentPlayingSide === 'back' && "bg-purple-200 dark:bg-purple-800"
                )}
              >
                {isAudioPlaying && currentPlayingSide === 'back' 
                  ? <Pause className="h-3 w-3" /> 
                  : <Volume2 className="h-3 w-3" />
                }
              </Button>
            )}
          </div>
        </div>
      </div>
      <audio 
        ref={audioRef} 
        className="hidden" 
        onEnded={() => {
          setIsAudioPlaying(false);
          setCurrentPlayingSide(null);
        }}
        onPause={() => {
          setIsAudioPlaying(false);
          setCurrentPlayingSide(null);
        }}
      />
      
      <style>
        {`
        .flashcard {
          transition: transform 0.3s;
          aspect-ratio: 0.65;
          min-height: 180px;
        }
        
        @media (max-width: 640px) {
          .flashcard {
            min-height: 160px;
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
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
          padding: min(3%, 0.75rem);
          font-size: clamp(0.8rem, 3vw, 1rem);
          overflow: hidden;
          border-radius: 12px;
          box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .flashcard-front {
          background: linear-gradient(140deg, #e0b2ff 0%, #af8cff 100%);
          border: 1px solid rgba(175, 140, 255, 0.5);
        }
        
        .flashcard-back {
          transform: rotateY(180deg);
          background: linear-gradient(140deg, #ffb6dc 0%, #f38bc3 100%);
          border: 1px solid rgba(243, 139, 195, 0.5);
          box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.6), 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .flashcard-inner:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .flashcard.flipped .flashcard-inner:hover {
          transform: translateY(-5px) rotateY(180deg);
        }
        
        /* Gestion du texte */
        .flashcard-front div,
        .flashcard-back div {
          max-height: 100%;
          overflow-y: auto;
          word-break: break-word;
        }
        
        /* Barres de défilement plus discrètes */
        .flashcard-front div::-webkit-scrollbar,
        .flashcard-back div::-webkit-scrollbar {
          width: 4px;
        }
        
        .flashcard-front div::-webkit-scrollbar-thumb,
        .flashcard-back div::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        
        .flashcard-front div::-webkit-scrollbar-track,
        .flashcard-back div::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
        }
        
        /* Taille de texte adaptative */
        @media (max-width: 640px) {
          .flashcard-front,
          .flashcard-back {
            font-size: clamp(0.75rem, 2.5vw, 0.85rem);
          }
        }
        `}
      </style>
    </div>
  );
};

export default FlashCard;
