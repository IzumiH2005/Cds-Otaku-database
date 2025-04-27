import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Heart, Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Version simplifiée de la page d'index sans dépendances à IndexedDB
 * Utilisée pour vérifier si l'application peut se charger correctement
 */
const SimpleIndex = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simuler un délai de chargement pour montrer que le composant fonctionne
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-foreground">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-5xl">🎭</span>
          <h1 className="text-5xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            CDS<br />FLASHCARD-<br />BASE
          </h1>
          <span className="text-5xl">🎭</span>
        </div>
        
        <p className="text-xl mb-12 max-w-lg">
          Créez des flashcards sur les verses de votre choix et accédez aux notes de d'autres quizzeurs ⚡
        </p>
        
        <Button 
          size="lg" 
          asChild
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 mb-8 group shadow-lg hover:shadow-xl"
        >
          <Link to="/basic-test">
            Faire un test basique <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        
        <div className="mb-8 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg max-w-md">
          <p className="text-lg font-medium">Statut de chargement</p>
          <div className="mt-2 flex items-center">
            {isLoaded ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Page chargée avec succès</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span>Chargement en cours...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
              <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">Créez</h3>
            <p className="text-muted-foreground">
              Créez facilement vos propres flashcards avec texte, images et audio
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">Apprenez</h3>
            <p className="text-muted-foreground">
              Étudiez efficacement avec des modes d'apprentissage adaptés à votre style
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
              <Heart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">Partagez</h3>
            <p className="text-muted-foreground">
              Partagez vos decks avec d'autres utilisateurs grâce à un simple code
            </p>
          </div>
        </div>
        
        <div className="mt-16 p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl border border-indigo-200/20 dark:border-indigo-800/20 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-medium">Page de diagnostic</h3>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Cette page est une version simplifiée destinée au diagnostic. Elle n'utilise pas IndexedDB ou d'autres fonctionnalités
            avancées qui pourraient causer des problèmes. Si cette page s'affiche correctement mais que la page principale non,
            le problème est probablement lié aux opérations de stockage.
          </p>
        </div>
        
        <div className="mt-8 flex space-x-4">
          <Button asChild variant="outline">
            <Link to="/basic-test">Aller à la page de test</Link>
          </Button>
          <Button asChild>
            <a href="/">Réessayer la page principale</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleIndex;