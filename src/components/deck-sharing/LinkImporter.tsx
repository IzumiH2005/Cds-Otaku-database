
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LinkImporterProps {
  onJsonContentChange: (content: string) => void;
  onError: (error: string | null) => void;
}

const LinkImporter = ({ onJsonContentChange, onError }: LinkImporterProps) => {
  const [linkValue, setLinkValue] = useState<string>("");
  const [isImportingLink, setIsImportingLink] = useState<boolean>(false);
  const { toast } = useToast();

  const handleImportFromLink = async () => {
    if (!linkValue) {
      onError("Veuillez entrer un lien de partage");
      return;
    }

    setIsImportingLink(true);
    onError(null);

    try {
      const response = await fetch(linkValue);
      if (!response.ok) {
        throw new Error("Lien invalide ou expiré");
      }
      
      const content = await response.text();
      onJsonContentChange(content);
      
      toast({
        title: "Lien chargé avec succès",
        description: "Vous pouvez maintenant importer le deck",
      });
    } catch (error) {
      console.error("Erreur lors du chargement du lien:", error);
      onError("Impossible de charger le deck à partir de ce lien");
    } finally {
      setIsImportingLink(false);
    }
  };

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor="deck-link">Lien de partage</Label>
      <div className="flex gap-2">
        <Input 
          id="deck-link" 
          type="url" 
          placeholder="https://exemple.com/deck.json" 
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
        />
        <Button 
          variant="outline"
          onClick={handleImportFromLink}
          disabled={isImportingLink}
        >
          {isImportingLink ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default LinkImporter;
