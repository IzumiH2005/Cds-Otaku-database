import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { generateSampleData } from "./lib/localStorage";
import { initStorageAdapter, getDecks } from "./lib/storageAdapter";
import { hasSession } from "./lib/sessionManager";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LayoutContainer } from "@/components/LayoutContainer";
import ZoomControl from "@/components/ZoomControl";
import AppWebViewProvider from "@/components/AppWebViewProvider";

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

const queryClient = new QueryClient();

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!hasSession()) {
    return <Navigate to="/login" replace />;
  }
  
  return <LayoutContainer>{children}</LayoutContainer>;
};

const App = () => {
  const [storageInitialized, setStorageInitialized] = useState(false);

  useEffect(() => {
    // Initialiser l'adaptateur de stockage (IndexedDB)
    const initStorage = async () => {
      try {
        await initStorageAdapter();
        console.log('Adaptateur de stockage IndexedDB initialisé avec succès');
        
        // Vérifier si des données existent déjà
        const existingDecks = await getDecks();
        if (existingDecks.length === 0) {
          console.log('Aucun deck trouvé, génération de données d\'exemple...');
          // Seulement générer des données de test si aucune n'existe
          generateSampleData();
        }
        
        setStorageInitialized(true);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'adaptateur de stockage:', error);
        
        // En cas d'erreur grave, générer quand même des données de test comme fallback
        console.warn('Génération de données de secours...');
        generateSampleData();
        setStorageInitialized(true);
      }
    };
    
    initStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppWebViewProvider>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <ZoomControl />
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
              
              <Route path="/deck/:deckId/theme/:themeId/study" element={
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
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          </AppWebViewProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;