
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Clipboard, Share2, Check, Copy, QrCode, Link2, Send, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDecksSync as getDecks, createShareCodeSync as createShareCode, Deck } from "@/lib/localStorage";
import { exportSessionData, getSessionKey } from "@/lib/sessionManager";

const SharePage = () => {
  const { toast } = useToast();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState<string>("7");
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exportData, setExportData] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const decks = getDecks();

  const generateShareCode = async () => {
    if (!selectedDeck) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un deck à partager",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const days = parseInt(expiryDays, 10);
      const code = await createShareCode(selectedDeck, days);
      const url = `${window.location.origin}/import/${code}`;
      
      setShareCode(code);
      setShareUrl(url);
      
      toast({
        title: "Code généré avec succès",
        description: "Le code de partage a été créé et peut maintenant être partagé",
      });
    } catch (error) {
      console.error("Error generating share code:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le code de partage",
        variant: "destructive",
      });
    }
  };
  
  const generateExportData = async () => {
    const sessionKey = getSessionKey();
    if (!sessionKey) {
      toast({
        title: "Session non trouvée",
        description: "Vous devez être connecté pour exporter vos données",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const data = exportSessionData();
      if (!data) {
        throw new Error("Aucune donnée à exporter");
      }
      
      // Convertir en chaîne si ce n'est pas déjà le cas
      const exportDataStr = JSON.stringify(data);
      setExportData(exportDataStr);
      
      toast({
        title: "Données exportées",
        description: "Vos données ont été exportées avec succès",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter vos données",
        variant: "destructive",
      });
    }
  };
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      function() {
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
        
        toast({
          title: "Copié !",
          description: `${type === 'url' ? 'Le lien' : 'Le code'} a été copié dans le presse-papier`,
        });
      },
      function(err) {
        console.error('Erreur lors de la copie:', err);
        toast({
          title: "Erreur",
          description: "Impossible de copier dans le presse-papier",
          variant: "destructive",
        });
      }
    );
  };
  
  const downloadExportData = () => {
    if (!exportData) return;
    
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Téléchargement démarré",
      description: "Le fichier d'export a été téléchargé",
    });
  };

  return (
    <div className="container max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Partager vos decks
        </h1>
        <p className="text-muted-foreground mt-2">
          Générez des codes de partage pour vos decks ou exportez toutes vos données
        </p>
      </header>

      <Tabs defaultValue="share-deck" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="share-deck" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Partager un deck
          </TabsTrigger>
          <TabsTrigger value="export-data" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Exporter les données
          </TabsTrigger>
        </TabsList>

        <TabsContent value="share-deck" className="space-y-6">
          <Card className="border-indigo-100 dark:border-indigo-900/30">
            <CardHeader>
              <CardTitle>Partager un deck de flashcards</CardTitle>
              <CardDescription>
                Créez un code de partage que vous pourrez envoyer à d'autres utilisateurs
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deck-select">Sélectionnez un deck</Label>
                <Select value={selectedDeck || ""} onValueChange={setSelectedDeck}>
                  <SelectTrigger id="deck-select" className="border-indigo-200 dark:border-indigo-800/30">
                    <SelectValue placeholder="Choisir un deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.length > 0 ? (
                      decks.map((deck: Deck) => (
                        <SelectItem key={deck.id} value={deck.id}>
                          {deck.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Aucun deck disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry">Durée de validité</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="expiry" className="border-indigo-200 dark:border-indigo-800/30">
                    <SelectValue placeholder="Choisir une durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jour</SelectItem>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateShareCode} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Générer un code de partage
              </Button>
            </CardContent>
            
            {shareCode && shareUrl && (
              <CardFooter className="flex flex-col space-y-4">
                <div className="w-full p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Code de partage</Label>
                      <Badge variant="outline" className="font-mono text-xs">
                        {expiryDays} jours
                      </Badge>
                    </div>
                    <div className="relative">
                      <Input 
                        value={shareCode} 
                        readOnly 
                        className="pr-12 font-mono bg-white dark:bg-black border-indigo-200 dark:border-indigo-800/30"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-8 w-8 text-indigo-500"
                        onClick={() => copyToClipboard(shareCode, 'code')}
                      >
                        {copySuccess === 'code' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lien d'invitation</Label>
                    <div className="relative">
                      <Input 
                        value={shareUrl} 
                        readOnly 
                        className="pr-12 font-mono bg-white dark:bg-black border-indigo-200 dark:border-indigo-800/30"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-8 w-8 text-indigo-500"
                        onClick={() => copyToClipboard(shareUrl, 'url')}
                      >
                        {copySuccess === 'url' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="w-full flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800/30">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800/30">
                    <Link2 className="h-4 w-4" />
                    Copier le lien
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800/30">
                    <Send className="h-4 w-4" />
                    Envoyer par email
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Vous avez reçu un code de partage ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importez un deck partagé en utilisant le code reçu
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/import">
                <Upload className="mr-2 h-4 w-4" />
                Importer un deck
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="export-data" className="space-y-6">
          <Card className="border-indigo-100 dark:border-indigo-900/30">
            <CardHeader>
              <CardTitle>Exporter toutes vos données</CardTitle>
              <CardDescription>
                Créez une sauvegarde de vos decks, thèmes et flashcards pour les transférer ou les sécuriser
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  Informations sur l'exportation
                </h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>Les données exportées incluent tous vos decks, thèmes et flashcards</li>
                  <li>Le fichier d'export contiendra également votre clé de session</li>
                  <li>Conservez ce fichier en lieu sûr pour protéger vos données</li>
                </ul>
              </div>
              
              <Button 
                onClick={generateExportData} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Générer l'export
              </Button>
            </CardContent>
            
            {exportData && (
              <CardFooter className="flex flex-col space-y-4">
                <div className="w-full p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Données exportées</Label>
                    <Badge variant="outline" className="font-mono text-xs">
                      {new Date().toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="relative">
                    <div className="max-h-32 overflow-y-auto bg-white dark:bg-black p-3 rounded border border-indigo-200 dark:border-indigo-800/30 text-xs font-mono whitespace-pre-wrap">
                      {exportData.length > 500 
                        ? `${exportData.substring(0, 500)}...` 
                        : exportData}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={downloadExportData}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le fichier JSON
                  </Button>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Vous pourrez importer cette sauvegarde plus tard en utilisant la fonction d'import</p>
                </div>
              </CardFooter>
            )}
          </Card>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Vous avez un fichier à importer ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Restaurez une sauvegarde ou importez des decks depuis un fichier JSON
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/import">
                <Upload className="mr-2 h-4 w-4" />
                Importer des données
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SharePage;
