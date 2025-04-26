import React, { useState, useEffect } from 'react';
import * as storage from '@/lib/localStorage';
import * as compatStorage from '@/lib/storageCompatLayer';
import * as enhancedDB from '@/lib/enhancedIndexedDB';

// Interface pour l'état de la page
interface TestState {
  isDbInitialized: boolean;
  userCount: number;
  decksCount: number;
  themesCount: number;
  flashcardsCount: number;
  testResults: { name: string; status: 'success' | 'error'; message: string }[];
}

const TestIndexedDBPage: React.FC = () => {
  const [state, setState] = useState<TestState>({
    isDbInitialized: false,
    userCount: 0,
    decksCount: 0,
    themesCount: 0,
    flashcardsCount: 0,
    testResults: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction d'ajout des résultats de test
  const addTestResult = (name: string, status: 'success' | 'error', message: string) => {
    setState(prev => ({
      ...prev,
      testResults: [...prev.testResults, { name, status, message }],
    }));
  };

  // Fonction pour exécuter un test
  const runTest = async (name: string, testFn: () => Promise<string>) => {
    try {
      const message = await testFn();
      addTestResult(name, 'success', message);
    } catch (error) {
      addTestResult(name, 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Tests
  const runAllTests = async () => {
    setIsLoading(true);
    setError(null);
    setState(prev => ({ ...prev, testResults: [] }));

    try {
      // Test d'initialisation de la base
      await runTest('Initialisation DB', async () => {
        const keys = await enhancedDB.getAllKeys();
        return `DB initialisée avec ${keys.length} clés`;
      });

      // Test de création d'utilisateur
      await runTest('Création utilisateur', async () => {
        const user = await storage.getUser();
        if (user) {
          return `Utilisateur existant: ${user.name}`;
        }

        const newUser = await storage.setUser({
          id: 'user_test_' + Date.now(),
          name: 'Utilisateur Test',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        });

        const createdUser = await storage.getUser();
        if (!createdUser) throw new Error('Utilisateur non créé');
        
        return `Utilisateur créé: ${createdUser.name}`;
      });

      // Test de création de deck
      await runTest('Création deck', async () => {
        const user = await storage.getUser();
        if (!user) throw new Error('Pas d\'utilisateur pour créer un deck');

        const deck = await storage.createDeck({
          title: 'Test Deck IndexedDB',
          description: 'Deck de test pour IndexedDB',
          authorId: user.id,
          isPublic: false,
          tags: ['test', 'indexeddb'],
        });

        return `Deck créé: ${deck.title}`;
      });

      // Test de récupération des decks
      await runTest('Récupération decks', async () => {
        const decks = await storage.getDecks();
        return `${decks.length} decks récupérés`;
      });

      // Test de création de thème
      await runTest('Création thème', async () => {
        const decks = await storage.getDecks();
        if (decks.length === 0) throw new Error('Pas de deck pour créer un thème');

        const theme = await storage.createTheme({
          deckId: decks[0].id,
          title: 'Test Theme IndexedDB',
          description: 'Thème de test pour IndexedDB',
        });

        return `Thème créé: ${theme.title}`;
      });

      // Test de récupération des thèmes
      await runTest('Récupération thèmes', async () => {
        const themes = await storage.getThemes();
        return `${themes.length} thèmes récupérés`;
      });

      // Test de création de flashcard
      await runTest('Création flashcard', async () => {
        const decks = await storage.getDecks();
        if (decks.length === 0) throw new Error('Pas de deck pour créer une flashcard');

        const themes = await storage.getThemesByDeck(decks[0].id);

        const flashcard = await storage.createFlashcard({
          deckId: decks[0].id,
          themeId: themes.length > 0 ? themes[0].id : undefined,
          front: {
            text: 'Question de test IndexedDB',
          },
          back: {
            text: 'Réponse de test IndexedDB',
          },
        });

        return `Flashcard créée: ${flashcard.front.text}`;
      });

      // Test de récupération des flashcards
      await runTest('Récupération flashcards', async () => {
        const flashcards = await storage.getFlashcards();
        return `${flashcards.length} flashcards récupérées`;
      });

      // Test de la couche de compatibilité
      await runTest('Test couche compatibilité', async () => {
        // Exécuter des appels synchrones et attendre un peu pour qu'ils se terminent
        const decksSync = compatStorage.getDecks();
        
        // Attendre un peu pour que les opérations asynchrones en arrière-plan se terminent
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Maintenant, récupérer les données de manière asynchrone pour comparer
        const decksAsync = await storage.getDecks();
        
        return `Couche de compatibilité: ${decksSync.length} decks en synchrone, ${decksAsync.length} decks en asynchrone`;
      });

      // Récupérer les compteurs finaux pour affichage
      const user = await storage.getUser();
      const decks = await storage.getDecks();
      const themes = await storage.getThemes();
      const flashcards = await storage.getFlashcards();

      setState(prev => ({
        ...prev,
        isDbInitialized: true,
        userCount: user ? 1 : 0,
        decksCount: decks.length,
        themesCount: themes.length,
        flashcardsCount: flashcards.length,
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Exécuter les tests au chargement de la page
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Migration IndexedDB</h1>

      {isLoading ? (
        <div className="p-4 border rounded bg-blue-50 mb-4">
          <p className="text-blue-700">Chargement et exécution des tests...</p>
        </div>
      ) : error ? (
        <div className="p-4 border rounded bg-red-50 mb-4">
          <p className="text-red-700">Erreur: {error}</p>
        </div>
      ) : (
        <div className="p-4 border rounded bg-green-50 mb-4">
          <p className="text-green-700">
            Tests terminés! IndexedDB {state.isDbInitialized ? 'initialisé' : 'non initialisé'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-500">Utilisateurs</p>
          <p className="text-xl font-semibold">{state.userCount}</p>
        </div>
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-500">Decks</p>
          <p className="text-xl font-semibold">{state.decksCount}</p>
        </div>
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-500">Thèmes</p>
          <p className="text-xl font-semibold">{state.themesCount}</p>
        </div>
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-500">Flashcards</p>
          <p className="text-xl font-semibold">{state.flashcardsCount}</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Résultats des tests</h2>
        <div className="border rounded overflow-hidden">
          {state.testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 border-b ${
                result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p className="font-semibold">
                {result.status === 'success' ? '✅' : '❌'} {result.name}
              </p>
              <p className="text-sm">{result.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Exécution...' : 'Relancer les tests'}
        </button>
      </div>
    </div>
  );
};

export default TestIndexedDBPage;