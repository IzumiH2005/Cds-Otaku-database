import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { generateSampleData } from "./lib/localStorage";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Pages
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import CreatePage from "@/pages/CreatePage";
import ProfilePage from "@/pages/ProfilePage";
import DeckPage from "@/pages/DeckPage";
import EditDeckPage from "@/pages/EditDeckPage";
import ThemePage from "@/pages/ThemePage";
import StudyPage from "@/pages/StudyPage";
import NotFound from "@/pages/NotFound";
import ImportPage from "@/pages/ImportPage";
import LoginPage from "@/pages/LoginPage";
import Index from "@/pages/Index";
import LearningMethodsPage from "@/pages/LearningMethodsPage";
import StatsPage from "@/pages/StatsPage";
import SharePage from "@/pages/SharePage";
import MyDecksPage from "@/pages/MyDecksPage";
import TestIndexedDBPage from "@/pages/TestIndexedDBPage";
import BasicTestPage from "@/pages/BasicTestPage";

const queryClient = new QueryClient();

// Import des fonctions de session
import { hasSession, hasSessionSync } from "./lib/sessionManager";

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  useEffect(() => {
    console.log("ProtectedRoute: Mounting");
    
    // Vérification synchrone immédiate avec optimisation pour une réponse plus rapide
    try {
      // Vérifier directement en localStorage sans attendre hasSessionSync()
      const sessionKey = localStorage.getItem('sessionKey');
      if (sessionKey && sessionKey.trim() !== '') {
        // Si une clé existe en localStorage, considérer la session comme valide immédiatement
        console.log("ProtectedRoute: Direct localStorage check found key:", sessionKey.substring(0, 5) + '...');
        setIsValidSession(true);
        setCheckingSession(false);
      } else {
        // Vérifier via hasSessionSync pour la compatibilité
        const validSync = hasSessionSync();
        console.log("ProtectedRoute: Synchronous check result:", validSync);
        if (validSync) {
          setIsValidSession(true);
          setCheckingSession(false);
        }
      }
    } catch (syncError) {
      console.warn("ProtectedRoute: Synchronous check failed:", syncError);
      // Continuez avec la vérification asynchrone
    }
    
    // Vérification asynchrone complète
    async function checkSession() {
      try {
        console.log("ProtectedRoute: Starting async session check");
        const valid = await hasSession();
        console.log("ProtectedRoute: Async check result:", valid);
        
        // Ne mettre à jour que si la vérification synchrone n'a pas déjà autorisé l'accès
        if (!isValidSession) {
          setIsValidSession(valid);
          setCheckingSession(false);
        }
      } catch (error) {
        console.error("ProtectedRoute: Error during async session check:", error);
        
        // En cas d'erreur asynchrone, ne pas rejeter si la vérification synchrone a réussi
        if (isValidSession !== true) {
          setIsValidSession(false);
          setCheckingSession(false);
        }
      }
    }
    
    // Commencer la vérification asynchrone si nécessaire
    if (isValidSession !== true) {
      checkSession();
    }
    
    // Timeout de sécurité pour éviter un blocage indéfini
    const timeoutId = setTimeout(() => {
      if (checkingSession) {
        console.warn("ProtectedRoute: Session check timeout, checking localStorage directly");
        
        // Dernière tentative directe avec localStorage
        const sessionKey = localStorage.getItem('sessionKey');
        if (sessionKey && sessionKey.trim() !== '') {
          console.log("ProtectedRoute: Timeout recovery - localStorage key found");
          setIsValidSession(true);
        } else {
          console.warn("ProtectedRoute: Session check complete failure, redirecting");
          setIsValidSession(false);
        }
        setCheckingSession(false);
      }
    }, 2000); // Réduit à 2 secondes pour une meilleure expérience utilisateur
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  if (checkingSession) {
    // Session en cours de vérification
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Vérification de la session...</p>
        </div>
      </div>
    );
  }
  
  if (isValidSession === false) {
    console.log("ProtectedRoute: Invalid session, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  console.log("ProtectedRoute: Valid session, rendering children");
  return <>{children}</>;
};

const App = () => {
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log("App: Component mounted");
    
    // Essayer de démarrer avec des valeurs locales pour accélérer le rendu initial
    let localDataInitialized = false;
    try {
      // Vérifier si localStorage contient déjà des données
      if (localStorage.getItem('dataInitialized') === 'true') {
        console.log("App: Using existing localStorage data");
        localDataInitialized = true;
      }
    } catch (e) {
      console.warn("App: Error checking localStorage:", e);
    }
    
    // Si des données locales existent, initialiser immédiatement
    if (localDataInitialized) {
      console.log("App: Setting initialized from localStorage");
      setInitialized(true);
    }
    
    // Initialize storage structure on first load
    async function initializeApp() {
      try {
        console.log("App: Starting data initialization");
        
        // Générer les données dans IndexedDB et mettre à jour
        await generateSampleData();
        
        // Marquer comme initialisé localement pour les prochains chargements
        try {
          localStorage.setItem('dataInitialized', 'true');
        } catch (storageError) {
          console.warn("App: Error setting localStorage flag:", storageError);
        }
        
        console.log("App: Data initialization completed");
        setInitialized(true);
      } catch (error) {
        console.error("App: Error during data initialization:", error);
        setInitError(String(error));
        setInitialized(true); // On continue quand même pour ne pas bloquer l'application
      }
    }
    
    // Lancer l'initialisation asynchrone
    if (!localDataInitialized) {
      initializeApp();
    }
    
    // Définir un délai maximum pour ne pas bloquer l'application indéfiniment
    const timeoutId = setTimeout(() => {
      if (!initialized) {
        console.warn("App: Initialization timeout, proceeding anyway");
        setInitialized(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Afficher un écran de chargement pendant l'initialisation
  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-lg text-muted-foreground">Initialisation de l'application...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <Routes>
              {/* Public routes without Navbar/Footer */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Index />} />
              
              {/* Protected routes with Navbar and Footer */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <HomePage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/explore" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <ExplorePage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/create" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <CreatePage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <ProfilePage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/deck/:id" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <DeckPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/deck/:id/edit" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <EditDeckPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/deck/:deckId/theme/:themeId" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <ThemePage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/deck/:id/study" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <StudyPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/import/:code" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <ImportPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/import" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <ImportPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              {/* New routes */}
              <Route path="/learning-methods" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <LearningMethodsPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/stats" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <StatsPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/share" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <SharePage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/my-decks" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <MyDecksPage />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/test-indexeddb" element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <TestIndexedDBPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/basic-test" element={<BasicTestPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;