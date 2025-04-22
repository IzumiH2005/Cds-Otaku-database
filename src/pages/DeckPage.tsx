import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Share2, 
  FolderPlus, 
  PlusCircle, 
  Edit,
  Copy, 
  BarChart3,
  Layers,
  Pencil,
  ArrowLeft,
  PlusIcon,
  Check,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FlashCard from "@/components/FlashCard";
import ThemeCard from "@/components/ThemeCard";
import FlashCardItem from "@/components/FlashCardItem";

import { 
  getDeck, 
  getThemesByDeck, 
  getFlashcardsByDeck, 
  getUser, 
  createTheme, 
  createFlashcard, 
  getBase64, 
  createShareCode,
  Theme,
  Flashcard
} from "@/lib/localStorage";

const DeckPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<any | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [user, setUser] = useState(getUser());
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  
  const [newTheme, setNewTheme] = useState({
    title: "",
    description: "",
    coverImage: undefined as string | undefined,
  });
  
  const [newCard, setNewCard] = useState({
    themeId: "" as string | undefined,
    front: {
      text: "",
      image: undefined as string | undefined,
      audio: undefined as string | undefined,
    },
    back: {
      text: "",
      image: undefined as string | undefined,
      audio: undefined as string | undefined,
    },
  });
  
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showFrontAdditionalInfo, setShowFrontAdditionalInfo] = useState(false);
  const [showBackAdditionalInfo, setShowBackAdditionalInfo] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const deckData = getDeck(id);
    if (!deckData) {
      toast({
        title: "Deck introuvable",
        description: "Le deck que vous recherchez n'existe pas",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    setDeck(deckData);
    const currentUser = getUser();
    setUser(currentUser);
    setIsOwner(deckData.authorId === currentUser?.id);
    
    const deckThemes = getThemesByDeck(id);
    setThemes(deckThemes);
    
    const deckCards = getFlashcardsByDeck(id);
    setFlashcards(deckCards);
    
    setIsLoading(false);
    
    const checkOwnershipInterval = setInterval(() => {
      const freshUser = getUser();
      if (freshUser?.id !== user?.id) {
        setUser(freshUser);
        setIsOwner(deckData.authorId === freshUser?.id);
      }
    }, 3000);
    
    return () => {
      clearInterval(checkOwnershipInterval);
    };
  }, [id, navigate, toast]);
  
  const refreshThemes = () => {
    if (!id) return;
    const deckThemes = getThemesByDeck(id);
    setThemes(deckThemes);
  };

  const refreshFlashcards = () => {
    if (!id) return;
    const deckCards = getFlashcardsByDeck(id);
    setFlashcards(deckCards);
  };
  
  const handleThemeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setNewTheme({ ...newTheme, coverImage: base64 });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image",
        variant: "destructive",
      });
    }
  };
  
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
  
  const createNewTheme = () => {
    if (!id) return;
    
    if (!newTheme.title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez saisir un titre pour le thème",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const theme = createTheme({
        deckId: id,
        title: newTheme.title.trim(),
        description: newTheme.description.trim(),
        coverImage: newTheme.coverImage,
      });
      
      setThemes([...themes, theme]);
      setShowThemeDialog(false);
      setNewTheme({
        title: "",
        description: "",
        coverImage: undefined,
      });
      
      toast({
        title: "Thème créé",
        description: "Le thème a été ajouté avec succès",
      });
    } catch (error) {
      console.error("Error creating theme:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le thème",
        variant: "destructive",
      });
    }
  };
  
  const createNewCard = () => {
    if (!id) return;
    
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
    
    // Réinitialiser les états d'informations supplémentaires
    setShowFrontAdditionalInfo(false);
    setShowBackAdditionalInfo(false);
    
    try {
      const card = createFlashcard({
        deckId: id,
        themeId: newCard.themeId || undefined,
        front: {
          text: newCard.front.text.trim(),
          image: newCard.front.image,
          audio: newCard.front.audio,
        },
        back: {
          text: newCard.back.text.trim(),
          image: newCard.back.image,
          audio: newCard.back.audio,
        },
      });
      
      setFlashcards([...flashcards, card]);
      setShowCardDialog(false);
      setNewCard({
        themeId: "",
        front: {
          text: "",
          image: undefined,
          audio: undefined,
        },
        back: {
          text: "",
          image: undefined,
          audio: undefined,
        },
      });
      
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
  
  const generateShareLink = () => {
    if (!id) return;
    
    try {
      const code = createShareCode(id, 30); // Expires in 30 days
      const shareLink = `${window.location.origin}/import/${code}`;
      setShareUrl(shareLink);
      setShareDialogOpen(true);
    } catch (error) {
      console.error("Error creating share code:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien de partage",
        variant: "destructive",
      });
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Lien copié",
      description: "Le lien de partage a été copié dans le presse-papier",
    });
  };
  
  const handleNextCard = () => {
    if (activeCardIndex < flashcards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    } else {
      setActiveCardIndex(0);
    }
  };
  
  const handlePrevCard = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
    } else {
      setActiveCardIndex(flashcards.length - 1);
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
  
  if (!deck) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Deck introuvable</h1>
          <p className="text-muted-foreground mb-6">
            Le deck que vous recherchez n'existe pas ou a été supprimé.
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
        <Link to="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Retour
        </Link>
      </div>
      
      <div className="bg-white flex items-center gap-4 px-3 py-3">
        {deck.coverImage ? (
          <div className="w-24 h-24 rounded-md overflow-hidden">
            <img
              src={deck.coverImage}
              alt={deck.title}
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
              <h1 className="text-lg font-bold">{deck?.title}</h1>
              {deck?.authorId === getUser()?.id && (
                <Button variant="ghost" size="icon" asChild className="h-5 w-5 p-0">
                  <Link to={`/deck/${id}/edit`}>
                    <Edit className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
              {deck.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              className="bg-black hover:bg-black/90 text-xs h-8 px-2 rounded-md"
              onClick={() => navigate(`/deck/${id}/study`)}
            >
              <BookOpen className="mr-1 h-3 w-3" />
              Étudier
            </Button>
            
            <Button variant="outline" onClick={generateShareLink} className="border text-xs h-8 px-2 rounded-md">
              <Share2 className="mr-1 h-3 w-3" />
              Partager
            </Button>
            
            {deck?.authorId === getUser()?.id && (
              <>
                <Button variant="outline" onClick={() => setShowThemeDialog(true)} className="border text-xs h-8 px-2 rounded-md">
                  <FolderPlus className="mr-1 h-3 w-3" />
                  Thème
                </Button>
                
                <Button variant="outline" onClick={() => setShowCardDialog(true)} className="border text-xs h-8 px-2 rounded-md">
                  <PlusCircle className="mr-1 h-3 w-3" />
                  Carte
                </Button>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center mr-2 mb-1 sm:mb-0">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2">
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {deck.authorId === user?.id ? user?.name.substring(0, 2).toUpperCase() : "AU"}
                </AvatarFallback>
              </Avatar>
              <span>{deck.authorId === user?.id ? user?.name : "Autre utilisateur"}</span>
            </div>
            <Separator orientation="vertical" className="mx-1 sm:mx-2 h-4 hidden sm:block" />
            <div className="flex items-center mr-2 mb-1 sm:mb-0">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{flashcards.length} cartes</span>
            </div>
            <Separator orientation="vertical" className="mx-1 sm:mx-2 h-4 hidden sm:block" />
            <div className="flex items-center">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{themes.length} thèmes</span>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="cards" className="mt-8">
        <TabsList className="mb-6 bg-secondary/20">
          <TabsTrigger value="cards" className="data-[state=active]:bg-primary data-[state=active]:text-white">Toutes les cartes</TabsTrigger>
          <TabsTrigger value="themes" className="data-[state=active]:bg-primary data-[state=active]:text-white">Thèmes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards" className="mt-0">
          {flashcards.length > 0 ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cartes ({flashcards.length})</h2>
                {deck?.authorId === getUser()?.id && (
                  <Button variant="outline" size="sm" onClick={() => setShowCardDialog(true)} 
                           className="text-xs sm:text-sm">
                    <PlusIcon className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                    Ajouter une carte
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 xxs:grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {flashcards.map((card) => (
                  <FlashCardItem
                    key={card.id}
                    card={card}
                    onDelete={refreshFlashcards}
                    onUpdate={refreshFlashcards}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-secondary/20">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium mb-2">Aucune carte</h3>
              <p className="text-muted-foreground mb-6">
                Ce deck ne contient pas encore de flashcards
              </p>
              {deck?.authorId === getUser()?.id && (
                <Button onClick={() => setShowCardDialog(true)}
                        className="text-xs sm:text-sm">
                  <PlusCircle className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  Ajouter une carte
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="themes" className="mt-0">
          {themes.length > 0 ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Thèmes ({themes.length})</h2>
                {deck?.authorId === getUser()?.id && (
                  <Button variant="outline" size="sm" onClick={() => setShowThemeDialog(true)}
                           className="text-xs sm:text-sm">
                    <PlusIcon className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                    Ajouter un thème
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 xxs:grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {themes.map((theme) => {
                  const themeCards = flashcards.filter(card => card.themeId === theme.id);
                  return (
                    <ThemeCard
                      key={theme.id}
                      id={theme.id}
                      deckId={id || ""}
                      title={theme.title}
                      description={theme.description}
                      cardCount={themeCards.length}
                      coverImage={theme.coverImage}
                      onDelete={refreshThemes}
                      onUpdate={refreshThemes}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-secondary/20">
              <FolderPlus className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium mb-2">Aucun thème</h3>
              <p className="text-muted-foreground mb-6">
                Ce deck ne contient pas encore de thèmes
              </p>
              {deck?.authorId === getUser()?.id && (
                <Button onClick={() => setShowThemeDialog(true)}
                        className="text-xs sm:text-sm">
                  <FolderPlus className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  Ajouter un thème
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un thème</DialogTitle>
            <DialogDescription>
              Créez un nouveau thème pour organiser vos flashcards
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="theme-title">Titre</Label>
              <Input
                id="theme-title"
                placeholder="Ex: Vocabulaire de base"
                value={newTheme.title}
                onChange={(e) => setNewTheme({ ...newTheme, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme-description">Description</Label>
              <Textarea
                id="theme-description"
                placeholder="Une brève description du thème..."
                rows={3}
                value={newTheme.description}
                onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme-image">Image de couverture (optionnelle)</Label>
              <Input
                id="theme-image"
                type="file"
                accept="image/*"
                onChange={handleThemeImageUpload}
              />
              {newTheme.coverImage && (
                <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border">
                  <img
                    src={newTheme.coverImage}
                    alt="Theme cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowThemeDialog(false)}>
              Annuler
            </Button>
            <Button onClick={createNewTheme}>
              <Check className="mr-2 h-4 w-4" />
              Créer le thème
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="flashcard-dialog-mobile bg-background">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base">Ajouter une flashcard</DialogTitle>
            <DialogDescription className="text-xs">
              Créez une nouvelle flashcard pour votre deck
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {themes.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="card-theme" className="text-xs">Thème (optionnel)</Label>
                <select
                  id="card-theme"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newCard.themeId}
                  onChange={(e) => setNewCard({ ...newCard, themeId: e.target.value || undefined })}
                >
                  <option value="">Aucun thème</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <Tabs defaultValue="front" className="w-full">
              <TabsList className="w-full h-8 mb-2 bg-secondary/20">
                <TabsTrigger value="front" className="text-xs h-7">Recto de la carte</TabsTrigger>
                <TabsTrigger value="back" className="text-xs h-7">Verso de la carte</TabsTrigger>
              </TabsList>
              
              <TabsContent value="front" className="mt-0 space-y-3">
                <div className="space-y-2 border p-3 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="front-text" className="text-xs">Texte</Label>
                    <Textarea
                      id="front-text"
                      placeholder="Ex: Définition, question, mot..."
                      rows={2}
                      className="text-xs p-2 min-h-[60px] resize-y"
                      value={newCard.front.text}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        front: { ...newCard.front, text: e.target.value },
                      })}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="front-image" className="text-xs">Image (optionnelle)</Label>
                    <Input
                      id="front-image"
                      type="file"
                      accept="image/*"
                      className="text-xs h-8"
                      onChange={(e) => handleImageUpload(e, 'front')}
                    />
                    {newCard.front.image && (
                      <div className="mt-1 relative w-full h-24 rounded-md overflow-hidden border">
                        <img
                          src={newCard.front.image}
                          alt="Front side"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full"
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
                  
                  <div className="space-y-1">
                    <Label htmlFor="front-audio" className="text-xs">Audio (optionnel)</Label>
                    <Input
                      id="front-audio"
                      type="file"
                      accept="audio/*"
                      className="text-xs h-8"
                      onChange={(e) => handleAudioUpload(e, 'front')}
                    />
                    {newCard.front.audio && (
                      <div className="mt-1 relative">
                        <audio className="w-full h-8" controls>
                          <source src={newCard.front.audio} />
                          Votre navigateur ne supporte pas l'élément audio.
                        </audio>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 right-1 w-5 h-5 rounded-full"
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
                </div>
              </TabsContent>
              
              <TabsContent value="back" className="mt-0 space-y-3">
                <div className="space-y-2 border p-3 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="back-text" className="text-xs">Texte</Label>
                    <Textarea
                      id="back-text"
                      placeholder="Ex: Réponse, traduction..."
                      rows={2}
                      className="text-xs p-2 min-h-[60px] resize-y"
                      value={newCard.back.text}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        back: { ...newCard.back, text: e.target.value },
                      })}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="back-image" className="text-xs">Image (optionnelle)</Label>
                    <Input
                      id="back-image"
                      type="file"
                      accept="image/*"
                      className="text-xs h-8"
                      onChange={(e) => handleImageUpload(e, 'back')}
                    />
                    {newCard.back.image && (
                      <div className="mt-1 relative w-full h-24 rounded-md overflow-hidden border">
                        <img
                          src={newCard.back.image}
                          alt="Back side"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full"
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
                  
                  <div className="space-y-1">
                    <Label htmlFor="back-audio" className="text-xs">Audio (optionnel)</Label>
                    <Input
                      id="back-audio"
                      type="file"
                      accept="audio/*"
                      className="text-xs h-8"
                      onChange={(e) => handleAudioUpload(e, 'back')}
                    />
                    {newCard.back.audio && (
                      <div className="mt-1 relative">
                        <audio className="w-full h-8" controls>
                          <source src={newCard.back.audio} />
                          Votre navigateur ne supporte pas l'élément audio.
                        </audio>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 right-1 w-5 h-5 rounded-full"
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCardDialog(false)} className="h-8 text-xs">
              Annuler
            </Button>
            <Button onClick={createNewCard} className="h-8 text-xs">
              <Check className="mr-1 h-3 w-3" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le deck</DialogTitle>
            <DialogDescription>
              Partagez ce lien avec d'autres personnes pour qu'ils puissent importer ce deck
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex space-x-2">
              <Input
                readOnly
                value={shareUrl}
                onClick={(e) => e.currentTarget.select()}
              />
              <Button variant="outline" onClick={copyShareLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Ce lien expirera dans 30 jours. Les personnes qui importent votre deck créeront une copie indépendante.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeckPage;
