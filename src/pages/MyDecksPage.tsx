import { useState, useEffect } from 'react';
import { getDecks, getUser } from '@/lib/storageAdapter';
import { type Deck, type User } from '@/lib/localStorage';
import DeckCard from '@/components/DeckCard';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Plus, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MyDecksPage = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  const refreshDecks = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
      
      const allDecks = await getDecks();
      const userDecks = allDecks.filter(deck => deck.authorId === currentUser?.id);
      
      console.log('Refreshing decks for user:', currentUser?.id);
      console.log('Found decks:', userDecks.length);
      
      setDecks(userDecks);
      toast({
        title: "Liste mise à jour",
        description: `${userDecks.length} deck(s) trouvé(s)`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des decks:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir la liste des decks",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
        
        const allDecks = await getDecks();
        const userDecks = currentUser ? allDecks.filter(deck => deck.authorId === currentUser.id) : [];
        console.log('Navigation refresh - User ID:', currentUser?.id);
        console.log('Navigation refresh - Decks found:', userDecks.length);
        setDecks(userDecks);
      } catch (error) {
        console.error('Erreur lors du chargement des decks:', error);
      }
    };
    
    loadData();
  }, [location.key]);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        const initialUser = await getUser();
        console.log('Initial load - User ID:', initialUser?.id);
        setUser(initialUser);
        
        const allDecks = await getDecks();
        const initialDecks = initialUser ? allDecks.filter(deck => deck.authorId === initialUser.id) : [];
        console.log('Initial load - Decks found:', initialDecks.length);
        setDecks(initialDecks);
      } catch (error) {
        console.error('Erreur lors du chargement initial des decks:', error);
      }
    };
    
    initialLoad();
    
    const initialRefreshTimeout = setTimeout(() => {
      refreshDecks();
    }, 1000);
    
    const intervalId = setInterval(async () => {
      try {
        const latestUser = await getUser();
        if (latestUser) {
          const allDecks = await getDecks();
          const freshDecks = allDecks.filter(deck => deck.authorId === latestUser.id);
          if (JSON.stringify(freshDecks) !== JSON.stringify(decks)) {
            setDecks(freshDecks);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour périodique:', error);
      }
    }, 2000);
    
    return () => {
      clearTimeout(initialRefreshTimeout);
      clearInterval(intervalId);
    };
  }, [decks]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes Decks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshDecks}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button asChild>
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer un nouveau deck
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end items-center mb-6">
        <div className="text-sm text-muted-foreground">
          {decks.length} deck{decks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas encore créé de decks.
          </p>
          <Button asChild>
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer votre premier deck
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {decks.map(deck => (
            <DeckCard 
              key={deck.id}
              id={deck.id}
              title={deck.title}
              description={deck.description}
              cardCount={0}
              coverImage={deck.coverImage}
              tags={deck.tags}
              author={user?.name || 'Utilisateur'}
              isPublic={deck.isPublic}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDecksPage;