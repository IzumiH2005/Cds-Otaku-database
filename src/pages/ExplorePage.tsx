
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, Filter, X, FileUp } from "lucide-react";
import DeckCard, { DeckCardProps } from "@/components/DeckCard";
import { getDecks, getFlashcardsByDeck, Deck, getUser, getSharedImportedDecks } from "@/lib/localStorage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ShareDeckDialog from "@/components/ShareDeckDialog";

const ExplorePage = () => {
  const [decks, setDecks] = useState<DeckCardProps[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<DeckCardProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  const loadPublicDecks = async () => {
    try {
      // Fetch published decks from Supabase
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('is_published', true);

      if (error) {
        console.error("Error fetching public decks:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les decks publics",
          variant: "destructive",
        });
        return;
      }

      // Transform Supabase deck data to DeckCardProps
      const deckCards: DeckCardProps[] = data.map(deck => ({
        id: deck.id,
        title: deck.title,
        description: deck.description || '',
        coverImage: deck.cover_image || undefined,
        tags: deck.tags || [],
        author: deck.author_name || 'Anonyme',
        cardCount: 0, // TODO: Implement card count retrieval
        isPublic: true
      }));

      // Si on est dans l'onglet "shared", ajouter les decks partagés importés
      if (activeTab === "shared") {
        const sharedDecks = getSharedImportedDecks();
        const localDecks = getDecks();
        
        const importedDeckCards = sharedDecks
          .map(shared => {
            const deck = localDecks.find(d => d.id === shared.localDeckId);
            if (!deck) return null;
            
            return {
              id: deck.id,
              title: deck.title,
              description: deck.description,
              coverImage: deck.coverImage,
              tags: deck.tags,
              author: "Importé",
              cardCount: getFlashcardsByDeck(deck.id).length,
              isPublic: deck.isPublic,
              isShared: true
            };
          })
          .filter(Boolean) as DeckCardProps[];
        
        // Combiner avec les decks publics
        deckCards.push(...importedDeckCards);
      }

      // Extract unique tags
      const tags = new Set<string>();
      deckCards.forEach(deck => {
        if (deck.tags) {
          deck.tags.forEach(tag => tags.add(tag));
        }
      });
      setAllTags(Array.from(tags));

      setDecks(deckCards);
    } catch (error) {
      console.error("Unexpected error loading public decks:", error);
    }
  };

  useEffect(() => {
    loadPublicDecks();
    
    // Set up periodic refresh
    const intervalId = setInterval(loadPublicDecks, 5000);
    
    return () => clearInterval(intervalId);
  }, [activeTab]);

  useEffect(() => {
    filterDecks();
  }, [searchTerm, activeFilters, decks]);

  const filterDecks = () => {
    let result = [...decks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        deck => 
          deck.title.toLowerCase().includes(term) || 
          deck.description.toLowerCase().includes(term) ||
          deck.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (activeFilters.length > 0) {
      result = result.filter(deck => 
        activeFilters.some(filter => deck.tags?.includes(filter))
      );
    }

    setFilteredDecks(result);
  };

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveFilters([]);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const openShareDialogForExport = () => {
    setSelectedDeckId(undefined); // Pas de deck spécifique, utilisez la liste
    setIsShareDialogOpen(true);
  };

  return (
    <div className="container px-4 py-8 explorer-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explorer les Decks</h1>
          <p className="text-muted-foreground">
            Découvrez et importez des decks de flashcards créés par la communauté
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button
            onClick={openShareDialogForExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileUp className="h-4 w-4" />
            Partager/Importer un deck
          </Button>
          <Button
            onClick={loadPublicDecks}
            variant="outline"
          >
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des decks..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {activeFilters.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Effacer les filtres
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="flex items-center mr-2">
          <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres:</span>
        </div>
        {allTags.map(tag => (
          <Badge
            key={tag}
            variant={activeFilters.includes(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleFilter(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="recent">Récents</TabsTrigger>
          <TabsTrigger value="popular">Populaires</TabsTrigger>
          <TabsTrigger value="shared">Partagés</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {filteredDecks.length > 0 ? (
            <div className="grid grid-cols-3 xxs:grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {filteredDecks.map((deck) => (
                <DeckCard key={deck.id} {...deck} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Aucun deck ne correspond à votre recherche
              </p>
              <Button variant="link" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <div className="grid grid-cols-3 xxs:grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
            {filteredDecks
              .sort((a, b) => {
                const deckA = getDecks().find(d => d.id === a.id);
                const deckB = getDecks().find(d => d.id === b.id);
                if (!deckA || !deckB) return 0;
                return new Date(deckB.createdAt).getTime() - new Date(deckA.createdAt).getTime();
              })
              .map((deck) => (
                <DeckCard key={deck.id} {...deck} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-0">
          <div className="grid grid-cols-3 xxs:grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
            {filteredDecks
              .sort((a, b) => b.cardCount - a.cardCount)
              .map((deck) => (
                <DeckCard key={deck.id} {...deck} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="shared" className="mt-0">
          {filteredDecks.length > 0 ? (
            <div className="grid grid-cols-3 xxs:grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {filteredDecks
                .filter(deck => deck.isShared)
                .map((deck) => (
                  <DeckCard key={deck.id} {...deck} />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Aucun deck partagé trouvé
              </p>
              <Button 
                variant="default"
                onClick={openShareDialogForExport}
                className="mt-4"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Importer un deck
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <ShareDeckDialog 
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        deckId={selectedDeckId}
      />
    </div>
  );
};

export default ExplorePage;
