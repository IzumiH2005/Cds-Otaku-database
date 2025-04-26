import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import * as indexedDB from "@/lib/enhancedIndexedDB";

const TestIndexedDBPage = () => {
  const [status, setStatus] = useState<string>("Initialisation...");
  const [savedData, setSavedData] = useState<string>("{}");
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    const testIndexedDB = async () => {
      try {
        setStatus("Initialisation d'IndexedDB...");
        
        // Sauvegarder des données
        await indexedDB.saveData("test-key", { message: "Bonjour depuis IndexedDB!", timestamp: new Date().toISOString() });
        setStatus("Données sauvegardées avec succès.");
        
        // Charger des données
        const data = await indexedDB.loadData("test-key", {});
        setSavedData(JSON.stringify(data, null, 2));
        setDataLoaded(true);
        
        setStatus("Test réussi: IndexedDB fonctionne correctement.");
      } catch (error) {
        console.error("Erreur de test IndexedDB:", error);
        setStatus(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    testIndexedDB();
  }, []);
  
  const handleRunAdditionalTest = async () => {
    try {
      setStatus("Exécution de tests supplémentaires...");
      
      // Ajouter un élément à un tableau
      await indexedDB.addItem("test-array", { id: Date.now().toString(), value: "Nouvel élément" }, []);
      
      // Charger le tableau
      const arrayData = await indexedDB.loadData("test-array", []);
      
      // Mettre à jour l'affichage
      setStatus("Tests supplémentaires réussis.");
      setSavedData(JSON.stringify(arrayData, null, 2));
    } catch (error) {
      console.error("Erreur lors des tests supplémentaires:", error);
      setStatus(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleClearData = async () => {
    try {
      setStatus("Suppression des données de test...");
      
      // Supprimer les données de test
      await indexedDB.removeData("test-key");
      await indexedDB.removeData("test-array");
      
      // Mise à jour de l'affichage
      setSavedData("{}");
      setStatus("Données supprimées avec succès.");
    } catch (error) {
      console.error("Erreur lors de la suppression des données:", error);
      setStatus(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Test d'IndexedDB
      </h1>
      
      <div className="grid gap-8">
        <Card className="shadow-md border-indigo-100 dark:border-indigo-900/30">
          <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-lg">
            <CardTitle>Statut du Test</CardTitle>
            <CardDescription>État actuel de l'exécution du test IndexedDB</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className={`p-4 rounded-md ${
              status.includes("réussi") 
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                : status.includes("Erreur") 
                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            }`}>
              <p>{status}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 justify-end bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-b-lg">
            <Button 
              onClick={handleRunAdditionalTest}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              Exécuter Test Supplémentaire
            </Button>
            <Button 
              onClick={handleClearData}
              variant="outline"
            >
              Effacer Données de Test
            </Button>
          </CardFooter>
        </Card>
        
        {dataLoaded && (
          <Card className="shadow-md border-indigo-100 dark:border-indigo-900/30">
            <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-lg">
              <CardTitle>Données Enregistrées</CardTitle>
              <CardDescription>Contenu récupéré depuis IndexedDB</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-60 text-sm">
                {savedData}
              </pre>
            </CardContent>
          </Card>
        )}
        
        <Card className="shadow-md border-indigo-100 dark:border-indigo-900/30">
          <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-lg">
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Informations sur l'utilisation d'IndexedDB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Fonctions Principales</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="text-indigo-600 dark:text-indigo-400">saveData(key, data)</code> - Enregistre des données</li>
                <li><code className="text-indigo-600 dark:text-indigo-400">loadData(key, defaultValue)</code> - Charge des données</li>
                <li><code className="text-indigo-600 dark:text-indigo-400">addItem(key, item, defaultValue)</code> - Ajoute un élément à un tableau</li>
                <li><code className="text-indigo-600 dark:text-indigo-400">updateItem(key, id, updateFn, idField, defaultValue)</code> - Met à jour un élément dans un tableau</li>
                <li><code className="text-indigo-600 dark:text-indigo-400">removeArrayItem(key, id, idField, defaultValue)</code> - Supprime un élément d'un tableau</li>
                <li><code className="text-indigo-600 dark:text-indigo-400">removeData(key)</code> - Supprime une clé et ses données</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Avantages par rapport à localStorage</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Plus grande capacité de stockage (pas limité à 5-10MB)</li>
                <li>Support de structures de données complexes sans nécessiter de stringification</li>
                <li>Opérations asynchrones qui n'impactent pas le thread principal</li>
                <li>Meilleures performances sur de grandes quantités de données</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestIndexedDBPage;