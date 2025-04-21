
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Copy, Key, LogIn, User, ArrowLeft, ArrowRight, Download, Upload, Info, FileCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { generateSessionKey, saveSessionKey, getSessionKey, exportSessionData, importSessionData } from "@/lib/sessionManager";

const LoginPage = () => {
  const [sessionKey, setSessionKey] = useState<string>(getSessionKey() || "");
  const [inputKey, setInputKey] = useState<string>("");
  const [showSessionInfo, setShowSessionInfo] = useState<boolean>(!!getSessionKey());
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(showSessionInfo ? "key" : "login");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Generate session key if not already present
    if (!sessionKey) {
      const newKey = generateSessionKey();
      setSessionKey(newKey);
      saveSessionKey(newKey);
      setShowSessionInfo(true);
    }
  }, [sessionKey]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(sessionKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    
    toast({
      title: "Clé copiée!",
      description: "Votre clé de session a été copiée dans le presse-papier.",
    });
  };

  const handleStartAdventure = () => {
    navigate("/");
  };

  const handleLoadSession = () => {
    if (!inputKey) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une clé de session.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, we would validate the key against a database
    // For demo purposes, we'll just save it and proceed
    saveSessionKey(inputKey);
    setSessionKey(inputKey);
    setShowSessionInfo(true);
    setActiveTab("key");
    
    toast({
      title: "Session chargée!",
      description: "Votre session a été chargée avec succès.",
    });
  };

  const generateNewKey = () => {
    const newKey = generateSessionKey();
    setSessionKey(newKey);
    saveSessionKey(newKey);
    setShowSessionInfo(true);
    
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
      setActiveTab("key");
    } else {
      toast({
        title: "Erreur",
        description: "Les données importées sont invalides.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-foreground">
      <Link to="/" className="absolute top-4 left-4 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Retour à l'accueil
      </Link>
      
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="text-4xl">🎭</span>
          <h1 className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">CDS</h1>
          <span className="text-4xl">🎭</span>
        </div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">FLASHCARD-BASE</h1>
        <p className="max-w-md mx-auto text-muted-foreground">
          Créez des flashcards sur les verses de votre choix et accédez aux notes de d'autres quizzeurs ⚡
        </p>
      </div>

      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-foreground">
              <LogIn className="mr-2 h-4 w-4" />
              Connexion
            </TabsTrigger>
            <TabsTrigger value="key" className="data-[state=active]:bg-white/20 data-[state=active]:text-foreground">
              <Key className="mr-2 h-4 w-4" />
              Clé de Session
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="bg-white/10 backdrop-blur-sm rounded-md mt-2 p-4 border border-indigo-200/30 dark:border-indigo-800/30">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-key" className="text-foreground">Clé de session</Label>
                <Input 
                  id="session-key" 
                  placeholder="Entrez votre clé de session" 
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="bg-white/20 text-foreground placeholder:text-foreground/50 border-indigo-200/30 dark:border-indigo-800/30"
                />
              </div>
              <Button 
                onClick={handleLoadSession} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Charger la session
              </Button>
              
              <div className="text-center pt-3 border-t border-indigo-200/20 dark:border-indigo-800/20 mt-3">
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center w-full transition-colors"
                >
                  <Upload className="mr-1 h-3 w-3" />
                  Importer des données sauvegardées
                </button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="key" className="bg-white/10 backdrop-blur-sm rounded-md mt-2 p-4 border border-indigo-200/30 dark:border-indigo-800/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="gradient" className="mb-3">Session active</Badge>
                <button
                  onClick={handleExportData}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center transition-colors"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Exporter
                </button>
              </div>
            
              <div className="text-center">
                <h3 className="text-xl font-medium">Votre clé de session:</h3>
                <div className="bg-indigo-500/5 rounded-lg p-3 my-3 font-mono text-lg tracking-wider border border-indigo-200/20 dark:border-indigo-800/20">
                  {sessionKey}
                </div>
                <p className="text-sm text-muted-foreground">
                  Conservez cette clé pour accéder à vos données ultérieurement
                </p>
              </div>
              
              <Button 
                onClick={handleCopyKey} 
                className="w-full bg-white/20 hover:bg-white/30 text-foreground"
              >
                {isCopied ? <FileCog className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {isCopied ? "Clé copiée!" : "Copier la clé"}
              </Button>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/5 hover:bg-white/10 text-foreground border-indigo-200/30 dark:border-indigo-800/30"
                  onClick={generateNewKey}
                >
                  Générer une nouvelle clé
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Button
        size="lg"
        onClick={handleStartAdventure}
        className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        Commencer l'aventure <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Button>
      
      <div className="mt-12 text-sm text-muted-foreground max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info className="h-4 w-4" />
          <p>Les clés de session permettent de sauvegarder vos données localement</p>
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

export default LoginPage;
