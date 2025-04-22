
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  ChevronLeft, 
  PlusCircle, 
  ArrowLeft,
  Check,
  X,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import FlashCard from "@/components/FlashCard";
import FlashCardItem from "@/components/FlashCardItem";

import { 
  getDeck, 
  getTheme, 
  getFlashcardsByTheme, 
  getUser, 
  createFlashcard, 
  getBase64,
  updateFlashcard,
  deleteFlashcard,
  Flashcard,
  Theme,
  Deck
} from "@/lib/localStorage";

const ThemePage = () => {
  const { deckId, themeId } = useParams<{ deckId: string; themeId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [user, setUser] = useState(getUser());
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showFrontAdditionalInfo, setShowFrontAdditionalInfo] = useState(false);
  const [showBackAdditionalInfo, setShowBackAdditionalInfo] = useState(false);

  // New flashcard form
  const [newCard, setNewCard] = useState({
    front: {
      text: "",
      image: undefined as string | undefined,
      audio: undefined as string | undefined,
      additionalInfo: "",
    },
    back: {
      text: "",
      image: undefined as string | undefined,
      audio: undefined as string | undefined,
      additionalInfo: "",
    },
  });

  useEffect(() => {
    if (!deckId || !themeId) return;
    
    const deckData = getDeck(deckId);
    if (!deckData) {
      toast({
        title: "Deck introuvable",
        description: "Le deck que vous recherchez n'existe pas",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    const themeData = getTheme(themeId);
    if (!themeData) {
      toast({
        title: "Thème introuvable",
        description: "Le thème que vous recherchez n'existe pas",
        variant: "destructive",
      });
      navigate(`/deck/${deckId}`);
      return;
    }
    
    setDeck(deckData);
    setTheme(themeData);
    setIsOwner(deckData.authorId === user?.id);
    
    // Load flashcards
    const themeCards = getFlashcardsByTheme(themeId);
    setFlashcards(themeCards);
    
    setIsLoading(false);
  }, [deckId, themeId, navigate, toast, user?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 5 Mo",
          variant: "destructive",
        });
        return;
      }
      
      const base64 = await getBase64(file);
      
      if (side === 'front') {
        setNewCard({
          ...newCard,
          front: { ...newCard.front, image: base64 },
        });
      } else {
        setNewCard({
          ...newCard,
          back: { ...newCard.back, image: base64 },
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image",
        variant: "destructive",
      });
    }
  };
  
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier audio ne doit pas dépasser 10 Mo",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner un fichier audio",
          variant: "destructive",
        });
        return;
      }
      
      const base64 = await getBase64(file);
      
      if (side === 'front') {
        setNewCard({
          ...newCard,
          front: { ...newCard.front, audio: base64 },
        });
      } else {
        setNewCard({
          ...newCard,
          back: { ...newCard.back, audio: base64 },
        });
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le fichier audio",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = flashcards.filter(card => card.id !== cardId);
    setFlashcards(updatedCards);
  };

  const handleUpdateCard = (updatedCard: Flashcard) => {
    const updatedCards = flashcards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    );
    setFlashcards(updatedCards);
  };

  const createNewCard = () => {
    if (!deckId || !themeId) return;
    
    if (!newCard.front.text.trim() && !newCard.front.image) {
      toast({
        title: "Contenu requis",
        description: "Veuillez ajouter du texte ou une image au recto de la carte",
        variant: "destructive",
      });
      return;
    }
    
    if (!newCard.back.text.trim() && !newCard.back.image) {
      toast({
        title: "Contenu requis",
        description: "Veuillez ajouter du texte ou une image au verso de la carte",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const frontData = {
        text: newCard.front.text.trim(),
        image: newCard.front.image,
        audio: newCard.front.audio,
        additionalInfo: showFrontAdditionalInfo ? newCard.front.additionalInfo.trim() : undefined
      };
      
      const backData = {
        text: newCard.back.text.trim(),
        image: newCard.back.image,
        audio: newCard.back.audio,
        additionalInfo: showBackAdditionalInfo ? newCard.back.additionalInfo.trim() : undefined
      };
      
      const card = createFlashcard({
        deckId,
        themeId,
        front: frontData,
        back: backData,
      });
      
      setFlashcards([...flashcards, card]);
      setShowCardDialog(false);
      
      // Reset form
      setNewCard({
        front: {
          text: "",
          image: undefined,
          audio: undefined,
          additionalInfo: "",
        },
        back: {
          text: "",
          image: undefined,
          audio: undefined,
          additionalInfo: "",
        },
      });
      setShowFrontAdditionalInfo(false);
      setShowBackAdditionalInfo(false);
      
      toast({
        title: "Carte créée",
        description: "La flashcard a été ajoutée avec succès",
      });
    } catch (error) {
      console.error("Error creating flashcard:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la flashcard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!deck || !theme) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Thème introuvable</h1>
          <p className="text-muted-foreground mb-6">
            Le thème que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-0 py-0">
      <div className="px-2 py-2">
        <Link to={`/deck/${deckId}`} className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Retour au deck
        </Link>
      </div>
      
      <div className="bg-white flex items-center gap-4 px-3 py-3">
        {theme.coverImage ? (
          <div className="w-24 h-24 rounded-md overflow-hidden">
            <img
              src={theme.coverImage}
              alt={theme.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-md">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-bold">{deck.title} · {theme.title}</h1>
            </div>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
              {theme.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              className="bg-black hover:bg-black/90 text-xs h-8 px-2 rounded-md"
              onClick={() => navigate(`/deck/${deckId}/theme/${themeId}/study`)}
            >
              <BookOpen className="mr-1 h-3 w-3" />
              Étudier ce thème
            </Button>
            
            {isOwner && (
              <Button 
                variant="outline" 
                onClick={() => setShowCardDialog(true)}
                className="border text-xs h-8 px-2 rounded-md"
              >
                <PlusCircle className="mr-1 h-3 w-3" />
                Ajouter une carte
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 px-3 py-2 bg-gray-100">
        <button className="bg-white text-xs px-2 py-1 rounded-md font-medium">Toutes les cartes</button>
        <button className="text-xs px-2 py-1 text-muted-foreground">Thèmes</button>
      </div>
      
      <div className="px-3 pt-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium">Cartes dans ce thème ({flashcards.length})</h2>
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCardDialog(true)}
              className="h-7 rounded-full"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              <span className="text-[10px]">Ajouter une carte</span>
            </Button>
          )}
        </div>
        
        {flashcards.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 pt-3">
            {flashcards.map((card) => (
              <FlashCardItem 
                key={card.id} 
                card={card} 
                onDelete={() => handleDeleteCard(card.id)}
                onUpdate={handleUpdateCard}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 mt-3 bg-gray-50 rounded-md">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <h3 className="text-sm font-medium mb-1">Aucune carte</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Ce thème ne contient pas encore de flashcards
            </p>
            {isOwner && (
              <Button onClick={() => setShowCardDialog(true)} 
                     className="text-xs h-8 bg-black hover:bg-black/90">
                <PlusCircle className="mr-1 h-3 w-3" />
                Ajouter une carte
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Add Card Dialog */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Ajouter une flashcard au thème {theme.title}</DialogTitle>
            <DialogDescription className="text-xs">
              Créez une nouvelle flashcard pour ce thème
            </DialogDescription>
          </DialogHeader>
          
          <div className="pt-2 space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">Recto de la carte</h3>
              
              <div className="space-y-1">
                <Label htmlFor="front-text" className="text-xs font-normal">Texte</Label>
                <Textarea
                  id="front-text"
                  placeholder="Ex: Définition, question, mot..."
                  rows={2}
                  className="text-sm resize-none"
                  value={newCard.front.text}
                  onChange={(e) => setNewCard({
                    ...newCard,
                    front: { ...newCard.front, text: e.target.value },
                  })}
                />
              </div>
              
              <div className="space-y-1 mt-3">
                <Label htmlFor="front-image" className="text-xs font-normal">Image (optionnelle)</Label>
                <div className="flex items-center">
                  <Input
                    id="front-image"
                    type="file"
                    accept="image/*"
                    className="text-xs h-8"
                    onChange={(e) => handleImageUpload(e, 'front')}
                  />
                </div>
                {newCard.front.image && (
                  <div className="mt-2 relative">
                    <div className="text-xs">Aucun fichier choisi</div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-2 w-4 h-4 rounded-full"
                      onClick={() => setNewCard({
                        ...newCard,
                        front: { ...newCard.front, image: undefined },
                      })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 mt-3">
                <Label htmlFor="front-audio" className="text-xs font-normal">Audio (optionnel)</Label>
                <div className="flex items-center">
                  <Input
                    id="front-audio"
                    type="file"
                    accept="audio/*"
                    className="text-xs h-8"
                    onChange={(e) => handleAudioUpload(e, 'front')}
                  />
                </div>
                {newCard.front.audio && (
                  <div className="mt-2 relative">
                    <div className="text-xs">Aucun fichier choisi</div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-2 w-4 h-4 rounded-full"
                      onClick={() => setNewCard({
                        ...newCard,
                        front: { ...newCard.front, audio: undefined },
                      })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox 
                  id="show-front-additional-info" 
                  className="h-3 w-3"
                  checked={showFrontAdditionalInfo}
                  onCheckedChange={(checked) => {
                    setShowFrontAdditionalInfo(checked as boolean);
                  }}
                />
                <label 
                  htmlFor="show-front-additional-info" 
                  className="text-xs cursor-pointer"
                >
                  Ajouter des informations supplémentaires
                </label>
              </div>

              {showFrontAdditionalInfo && (
                <div className="space-y-1 mt-2">
                  <Label htmlFor="front-additional-info" className="text-xs font-normal">Informations supplémentaires</Label>
                  <Textarea
                    id="front-additional-info"
                    placeholder="Notes, contexte ou détails complémentaires..."
                    rows={2}
                    className="text-sm resize-none"
                    value={newCard.front.additionalInfo}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      front: { ...newCard.front, additionalInfo: e.target.value },
                    })}
                  />
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <h3 className="font-medium text-sm mb-2">Verso de la carte</h3>
              
              <div className="space-y-1">
                <Label htmlFor="back-text" className="text-xs font-normal">Texte</Label>
                <Textarea
                  id="back-text"
                  placeholder="Ex: Réponse, traduction..."
                  rows={2}
                  className="text-sm resize-none"
                  value={newCard.back.text}
                  onChange={(e) => setNewCard({
                    ...newCard,
                    back: { ...newCard.back, text: e.target.value },
                  })}
                />
              </div>
              
              <div className="space-y-1 mt-3">
                <Label htmlFor="back-image" className="text-xs font-normal">Image (optionnelle)</Label>
                <div className="flex items-center">
                  <Input
                    id="back-image"
                    type="file"
                    accept="image/*"
                    className="text-xs h-8"
                    onChange={(e) => handleImageUpload(e, 'back')}
                  />
                </div>
                {newCard.back.image && (
                  <div className="mt-2 relative">
                    <div className="text-xs">Aucun fichier choisi</div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-2 w-4 h-4 rounded-full"
                      onClick={() => setNewCard({
                        ...newCard,
                        back: { ...newCard.back, image: undefined },
                      })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 mt-3">
                <Label htmlFor="back-audio" className="text-xs font-normal">Audio (optionnel)</Label>
                <div className="flex items-center">
                  <Input
                    id="back-audio"
                    type="file"
                    accept="audio/*"
                    className="text-xs h-8"
                    onChange={(e) => handleAudioUpload(e, 'back')}
                  />
                </div>
                {newCard.back.audio && (
                  <div className="mt-2 relative">
                    <div className="text-xs">Aucun fichier choisi</div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-2 w-4 h-4 rounded-full"
                      onClick={() => setNewCard({
                        ...newCard,
                        back: { ...newCard.back, audio: undefined },
                      })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox 
                  id="show-back-additional-info" 
                  className="h-3 w-3"
                  checked={showBackAdditionalInfo}
                  onCheckedChange={(checked) => {
                    setShowBackAdditionalInfo(checked as boolean);
                  }}
                />
                <label 
                  htmlFor="show-back-additional-info" 
                  className="text-xs cursor-pointer"
                >
                  Ajouter des informations supplémentaires
                </label>
              </div>

              {showBackAdditionalInfo && (
                <div className="space-y-1 mt-2">
                  <Label htmlFor="back-additional-info" className="text-xs font-normal">Informations supplémentaires</Label>
                  <Textarea
                    id="back-additional-info"
                    placeholder="Notes, contexte ou détails complémentaires..."
                    rows={2}
                    className="text-sm resize-none"
                    value={newCard.back.additionalInfo}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      back: { ...newCard.back, additionalInfo: e.target.value },
                    })}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCardDialog(false)} className="text-xs h-9">
              Annuler
            </Button>
            <Button onClick={createNewCard} className="bg-black hover:bg-black/90 text-xs h-9">
              Ajouter la carte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThemePage;
