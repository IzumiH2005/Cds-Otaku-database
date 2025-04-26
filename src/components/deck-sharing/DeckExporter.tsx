
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import { exportDeckToJson, getDecks } from "@/lib/localStorage";
import { useToast } from "@/hooks/use-toast";

interface DeckExporterProps {
  selectedDeck?: string;
  onDeckSelect: (deckId: string) => void;
}

const DeckExporter = ({ selectedDeck, onDeckSelect }: DeckExporterProps) => {
  const [jsonContent, setJsonContent] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { toast } = useToast();
  const decks = getDecks().filter(deck => !deck.isPublished);
  
  const handleExport = async () => {
    if (!selectedDeck) {
      toast({
        title: "Erreur",
        description: "Aucun deck sélectionné",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExporting(true);
      const exportedDeck = exportDeckToJson(selectedDeck);
      const jsonString = JSON.stringify(exportedDeck, null, 2);
      setJsonContent(jsonString);
      
      // Create download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportedDeck.title.replace(/\s+/g, '_')}_deck.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Deck exporté avec succès",
        description: "Le fichier JSON a été téléchargé",
      });
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      toast({
        title: "Erreur d'exportation",
        description: "Impossible d'exporter le deck",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Exportez votre deck au format JSON pour le partager avec d'autres utilisateurs.
      </p>
      
      {decks.length > 0 ? (
        <div className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="deck-select">Sélectionnez un deck</Label>
            <select 
              id="deck-select"
              value={selectedDeck}
              onChange={(e) => onDeckSelect(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>{deck.title}</option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={handleExport} 
            className="w-full"
            disabled={!selectedDeck || isExporting}
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exportation...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exporter le deck
              </>
            )}
          </Button>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vous n'avez pas encore créé de deck.</AlertDescription>
        </Alert>
      )}
      
      {jsonContent && (
        <div className="mt-4">
          <Label htmlFor="export-json">JSON du deck</Label>
          <Textarea 
            id="export-json" 
            value={jsonContent} 
            readOnly 
            rows={10} 
            className="font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
};

export default DeckExporter;
