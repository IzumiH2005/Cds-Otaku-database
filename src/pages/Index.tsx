
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Key, Copy, Plus, BookOpen, Check, Download, Upload, Info, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSessionKey, saveSessionKey, generateSessionKey, exportSessionData, importSessionData, verifySession } from '@/lib/sessionManager';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Index = () => {
  const navigate = useNavigate();
  const [sessionKey, setSessionKey] = useState(getSessionKey() || '');
  const [isCopied, setIsCopied] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  
  useEffect(() => {
    // Check if user has a valid session key
    const hasValidSession = verifySession();
    
    // Update the session key state
    setSessionKey(getSessionKey() || '');
  }, []);

  const handleCopyKey = () => {
    const currentSessionKey = getSessionKey();
    if (currentSessionKey) {
      navigator.clipboard.writeText(currentSessionKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      
      toast({
        title: "Clé copiée!",
        description: "Votre clé de session a été copiée dans le presse-papier.",
      });
    }
  };
  
  const handleGenerateKey = () => {
    const newKey = generateSessionKey();
    saveSessionKey(newKey);
    setSessionKey(newKey);
    
    toast({
      title: "Nouvelle clé générée!",
      description: "N'oubliez pas de la sauvegarder pour accéder à vos données ultérieurement.",
    });
  };
  
  const handleExportData = () => {
    const data = exportSessionData();
    setExportData(data);
    setShowExportDialog(true);
  };
  
  const handleImportData = () => {
    if (!importData.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer des données valides.",
        variant: "destructive",
      });
      return;
    }
    
    const success = importSessionData(importData);
    
    if (success) {
      toast({
        title: "Données importées",
        description: "Vos données ont été importées avec succès.",
      });
      setSessionKey(getSessionKey() || '');
      setShowImportDialog(false);
      setImportData('');
    } else {
      toast({
        title: "Erreur",
        description: "Les données importées sont invalides.",
        variant: "destructive",
      });
    }
  };

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
          <Link to="/explore">
            Commencer l'aventure <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link 
            to="/login" 
            className="text-foreground hover:text-primary flex items-center transition-colors"
          >
            <Key className="mr-2 h-4 w-4" />
            Avez-vous une clé de session?
          </Link>
          <span className="hidden sm:inline text-muted-foreground">ou</span>
          <button 
            onClick={handleGenerateKey}
            className="text-foreground hover:text-primary flex items-center transition-colors"
          >
            générer une nouvelle clé
          </button>
        </div>
        
        {sessionKey && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg max-w-md w-full mb-12">
            <Badge variant="gradient" className="mb-3">Session active</Badge>
            <h3 className="text-lg font-medium mb-2">Votre clé de session:</h3>
            <div className="bg-indigo-500/5 rounded-lg p-3 mb-3 font-mono text-lg tracking-wider border border-indigo-200/20 dark:border-indigo-800/20">
              {sessionKey}
            </div>
            <p className="text-sm mb-4 text-muted-foreground">
              Conservez cette clé pour accéder à vos données ultérieurement
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={handleCopyKey} 
                variant="outline"
                className="border-indigo-200/40 dark:border-indigo-800/40 hover:bg-indigo-500/10"
                size="sm"
              >
                {isCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {isCopied ? "Copié!" : "Copier"}
              </Button>
              <Button 
                onClick={handleExportData}
                variant="outline"
                className="border-indigo-200/40 dark:border-indigo-800/40 hover:bg-indigo-500/10"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
              <Button 
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="border-indigo-200/40 dark:border-indigo-800/40 hover:bg-indigo-500/10"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                Importer
              </Button>
            </div>
          </div>
        )}
        
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
            <h3 className="text-lg font-medium">À propos des clés de session</h3>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Les clés de session sont la façon la plus simple de sauvegarder vos progrès dans CDS Flashcard-Base. 
            Chaque clé est unique et vous permet d'accéder à vos decks et flashcards depuis n'importe quel appareil. 
            Conservez votre clé en lieu sûr ou exportez vos données pour une sauvegarde supplémentaire.
          </p>
        </div>
      </div>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter vos données</DialogTitle>
            <DialogDescription>
              Copiez ce code et conservez-le en lieu sûr pour restaurer vos données ultérieurement.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea 
              value={exportData} 
              readOnly 
              className="h-40 font-mono text-xs"
            />
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(exportData);
                toast({
                  title: "Données copiées",
                  description: "Les données ont été copiées dans le presse-papier.",
                });
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer vos données</DialogTitle>
            <DialogDescription>
              Collez le code d'exportation pour restaurer vos données.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea 
              value={importData} 
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Collez votre code d'exportation ici..." 
              className="h-40 font-mono text-xs"
            />
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImportData}
            >
              <Upload className="h-4 w-4 mr-1" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
