
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeckExporter from './deck-sharing/DeckExporter';
import FileImporter from './deck-sharing/FileImporter';
import LinkImporter from './deck-sharing/LinkImporter';

interface ShareDeckDialogProps {
  deckId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDeckDialog: React.FC<ShareDeckDialogProps> = ({ deckId, isOpen, onClose }) => {
  const [tab, setTab] = useState<string>("export");
  const [selectedDeck, setSelectedDeck] = useState<string | undefined>(deckId);
  const [jsonContent, setJsonContent] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Partager un Deck</DialogTitle>
          <DialogDescription>
            Exportez votre deck pour le partager ou importez un deck partagé par quelqu'un d'autre.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="export" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="export">Exporter</TabsTrigger>
            <TabsTrigger value="import">Importer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export">
            <DeckExporter 
              selectedDeck={selectedDeck} 
              onDeckSelect={setSelectedDeck} 
            />
          </TabsContent>
          
          <TabsContent value="import">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Importez un deck partagé au format JSON pour l'ajouter à votre collection.
              </p>

              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="file">Fichier JSON</TabsTrigger>
                  <TabsTrigger value="link">Lien de partage</TabsTrigger>
                </TabsList>
                
                <TabsContent value="file">
                  <FileImporter onClose={onClose} />
                </TabsContent>
                
                <TabsContent value="link">
                  <LinkImporter 
                    onJsonContentChange={setJsonContent}
                    onError={setImportError}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDeckDialog;
