
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileUp, RefreshCcw } from "lucide-react";
import { importDeckFromJson, updateDeckFromJson, getUser, SharedDeckExport } from "@/lib/localStorage";
import { useToast } from "@/hooks/use-toast";

interface FileImporterProps {
  onClose: () => void;
}

const FileImporter = ({ onClose }: FileImporterProps) => {
  const [jsonContent, setJsonContent] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateDeckJson = (jsonString: string): SharedDeckExport | null => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.id || !data.originalId || !data.title || !Array.isArray(data.themes) || !Array.isArray(data.flashcards)) {
        setImportError("Format de deck invalide");
        return null;
      }
      return data as SharedDeckExport;
    } catch (error) {
      setImportError("Erreur lors de l'analyse du JSON");
      return null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonContent(content);
      } catch (error) {
        setImportError("Format de fichier invalide");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const user = getUser();
    if (!user) {
      setImportError("Utilisateur non connecté");
      return;
    }
    
    const deckData = validateDeckJson(jsonContent);
    if (!deckData) return;
    
    try {
      setIsImporting(true);
      const newDeckId = importDeckFromJson(deckData, user.id);
      
      toast({
        title: "Deck importé avec succès",
        description: "Le deck a été ajouté à votre collection",
      });
      
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      setImportError("Impossible d'importer le deck");
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdate = async () => {
    const deckData = validateDeckJson(jsonContent);
    if (!deckData) return;
    
    try {
      setIsUpdating(true);
      const success = updateDeckFromJson(deckData);
      
      if (success) {
        toast({
          title: "Deck mis à jour avec succès",
          description: "Les modifications ont été appliquées",
        });
        onClose();
      } else {
        setImportError("Ce deck n'a pas été importé précédemment et ne peut pas être mis à jour");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setImportError("Impossible de mettre à jour le deck");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="deck-file">Fichier de deck</Label>
        <div className="flex gap-2">
          <Input 
            id="deck-file" 
            type="file" 
            accept=".json" 
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {jsonContent && (
        <div className="mt-4">
          <Label htmlFor="import-json">Contenu JSON</Label>
          <Textarea 
            id="import-json" 
            value={jsonContent}
            onChange={e => {
              setJsonContent(e.target.value);
              setImportError(null);
            }}
            rows={8} 
            className="font-mono text-xs"
          />
        </div>
      )}
      
      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2">
        <Button 
          onClick={handleImport} 
          className="flex-1"
          disabled={!jsonContent || isImporting}
        >
          {isImporting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Importation...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Importer comme nouveau
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleUpdate} 
          variant="outline"
          disabled={!jsonContent || isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Mise à jour...
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Mettre à jour existant
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileImporter;
