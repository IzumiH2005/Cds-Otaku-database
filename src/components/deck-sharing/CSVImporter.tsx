import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Info, AlertTriangle, Check } from "lucide-react";
import { createDeck, createFlashcard, getUser, Flashcard, Deck } from "@/lib/localStorage";

interface CSVImporterProps {
  onClose: () => void;
}

/**
 * Composant d'importation de cartes mémoire à partir d'un fichier CSV
 */
const CSVImporter = ({ onClose }: CSVImporterProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [delimiter, setDelimiter] = useState<string>("auto");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gère la sélection d'un fichier CSV
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier que c'est un fichier CSV
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setError("Le fichier doit être au format CSV (.csv)");
      setFile(null);
      setFileContent(null);
      setPreviewData([]);
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Extraire le nom du fichier pour le titre du deck par défaut
    const fileName = selectedFile.name.replace(/\.csv$/, '');
    setDeckTitle(fileName);
    
    // Lire et prévisualiser le fichier
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setFileContent(text);
        const rows = parseCSV(text);
        
        if (rows.length === 0) {
          setError("Le fichier CSV est vide");
          setPreviewData([]);
          return;
        }
        
        // Afficher un aperçu des premières lignes (max 5)
        setPreviewData(rows.slice(0, 5));
      } catch (error) {
        console.error("Erreur de lecture du CSV:", error);
        setError("Erreur de lecture du fichier CSV. Vérifiez le format.");
        setPreviewData([]);
      }
    };
    
    reader.readAsText(selectedFile);
  };
  
  // Actualiser l'aperçu quand le délimiteur change
  useEffect(() => {
    if (fileContent) {
      try {
        const rows = parseCSV(fileContent);
        if (rows.length > 0) {
          setPreviewData(rows.slice(0, 5));
          setError(null);
        }
      } catch (error) {
        console.error("Erreur de lecture avec le nouveau délimiteur:", error);
        setError("Erreur de lecture du CSV avec ce délimiteur.");
      }
    }
  }, [delimiter, fileContent]);
  
  /**
   * Parse le contenu CSV en tableau 2D
   */
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    
    // Déterminer le délimiteur si auto-détection
    let actualDelimiter = delimiter;
    if (delimiter === "auto") {
      // Échantillon pour la détection automatique (première ligne non vide)
      const sampleLine = lines.find(line => line.trim() !== '');
      if (sampleLine) {
        if (sampleLine.includes(';')) actualDelimiter = ';';
        else if (sampleLine.includes('\t')) actualDelimiter = '\t';
        else actualDelimiter = ',';
      }
    }
    
    return lines
      .filter(line => line.trim() !== '')
      .map(line => {
        // Gérer les valeurs entre guillemets
        const result: string[] = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
              // Double guillemet à l'intérieur d'une valeur entre guillemets = échappement
              currentValue += '"';
              i++; // Sauter le prochain guillemet
            } else {
              // Basculer l'état "entre guillemets"
              insideQuotes = !insideQuotes;
            }
          } else if (char === actualDelimiter && !insideQuotes) {
            // Délimiteur trouvé, ajouter la valeur actuelle au résultat
            result.push(currentValue.trim());
            currentValue = '';
          } else {
            // Ajouter le caractère à la valeur en cours
            currentValue += char;
          }
        }
        
        // Ajouter la dernière valeur
        result.push(currentValue.trim());
        return result;
      });
  };
  
  /**
   * Importe les données CSV comme un nouveau deck de flashcards
   */
  const handleImport = async () => {
    if (!file || !deckTitle.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez choisir un fichier et donner un titre au deck",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!fileContent) {
        throw new Error("Aucun contenu à importer");
      }
      
      // Utiliser le contenu du fichier déjà stocké
      const rows = parseCSV(fileContent);
      
      if (rows.length === 0) {
        throw new Error("Le fichier CSV est vide");
      }
      
      // Créer un nouveau deck
      const user = getUser();
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }
      
      const newDeck = createDeck({
        title: deckTitle,
        description: deckDescription || "Importé depuis CSV",
        authorId: user.id,
        isPublic: false,
        tags: ["importé", "csv"],
      });
      
      // Compteur de cartes importées avec succès
      let importedCount = 0;
      
      // Créer des flashcards à partir des lignes CSV
      for (const row of rows) {
        // Ignorer les lignes trop courtes
        if (row.length < 2) continue;
        
        // Créer une carte avec front/back (première et deuxième colonne)
        createFlashcard({
          deckId: newDeck.id,
          front: {
            text: row[0],
            additionalInfo: row.length > 2 ? row[2] : undefined,
          },
          back: {
            text: row[1],
            additionalInfo: row.length > 3 ? row[3] : undefined,
          }
        });
        
        importedCount++;
      }
      
      toast({
        title: "Importation réussie",
        description: `${importedCount} carte(s) importée(s) avec succès`,
      });
      
      setImportSuccess(true);
      setError(null);
      
      // Réinitialiser le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 2000);
    
    } catch (error) {
      console.error("Erreur d'importation:", error);
      setError(error instanceof Error ? error.message : "Erreur lors de l'importation");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="mx-auto rounded-full p-3 bg-green-100 text-green-600 mb-2">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <CardTitle className="text-center">Importer depuis CSV</CardTitle>
        <CardDescription className="text-center">
          Importez des flashcards depuis un fichier CSV
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Format attendu</AlertTitle>
          <AlertDescription className="text-sm">
            <p>Le fichier CSV doit contenir au minimum deux colonnes :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>1ère colonne : Recto (question)</li>
              <li>2ème colonne : Verso (réponse)</li>
              <li>3ème colonne (optionnelle) : Info supplémentaire recto</li>
              <li>4ème colonne (optionnelle) : Info supplémentaire verso</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="csv-file">Fichier CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isLoading || importSuccess}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="delimiter">Délimiteur</Label>
          <RadioGroup 
            id="delimiter" 
            value={delimiter} 
            onValueChange={setDelimiter}
            className="flex space-x-4"
            disabled={isLoading || importSuccess}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="delimiter-auto" />
              <Label htmlFor="delimiter-auto" className="cursor-pointer">Auto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="," id="delimiter-comma" />
              <Label htmlFor="delimiter-comma" className="cursor-pointer">Virgule (,)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value=";" id="delimiter-semicolon" />
              <Label htmlFor="delimiter-semicolon" className="cursor-pointer">Point-virgule (;)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="\t" id="delimiter-tab" />
              <Label htmlFor="delimiter-tab" className="cursor-pointer">Tabulation</Label>
            </div>
          </RadioGroup>
        </div>
        
        {previewData.length > 0 && (
          <div className="space-y-2">
            <Label>Aperçu des données</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/30">
              <table className="w-full text-sm">
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-muted last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="py-1 px-2">
                          {cell.length > 30 ? `${cell.substring(0, 30)}...` : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Aperçu des {previewData.length} premières lignes du fichier
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="deck-title">Titre du deck</Label>
          <Input
            id="deck-title"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            placeholder="Entrez un titre pour ce deck"
            disabled={isLoading || importSuccess}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deck-description">Description (optionnelle)</Label>
          <Input
            id="deck-description"
            value={deckDescription}
            onChange={(e) => setDeckDescription(e.target.value)}
            placeholder="Décrivez ce deck de flashcards"
            disabled={isLoading || importSuccess}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={!file || isLoading || importSuccess}
          className={importSuccess ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Importation...
            </>
          ) : importSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Importé avec succès
            </>
          ) : (
            "Importer les cartes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CSVImporter;