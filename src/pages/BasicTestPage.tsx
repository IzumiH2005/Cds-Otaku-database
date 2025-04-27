import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

/**
 * Page de test basique qui ne dépend pas d'IndexedDB
 * Utilisée pour vérifier le fonctionnement minimal de l'application
 */
const BasicTestPage = () => {
  const [browserInfo, setBrowserInfo] = useState<string>('Récupération des informations...');
  const [indexedDBAvailable, setIndexedDBAvailable] = useState<boolean | null>(null);
  const [indexedDBTest, setIndexedDBTest] = useState<{ status: 'pending' | 'success' | 'error', message: string }>({ 
    status: 'pending', 
    message: 'Test non exécuté' 
  });
  const [localStorageTest, setLocalStorageTest] = useState<{ status: 'pending' | 'success' | 'error', message: string }>({ 
    status: 'pending', 
    message: 'Test non exécuté' 
  });

  // Vérifier les capacités du navigateur
  useEffect(() => {
    // Récupérer des informations sur le navigateur
    const userAgent = navigator.userAgent;
    const browserName = userAgent.match(/(firefox|chrome|safari|opera|msie|trident(?=\/))\/?\s*(\d+)/i)?.[1] || 'Inconnu';
    
    // Vérifier la disponibilité d'IndexedDB
    const isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
    
    setBrowserInfo(`${browserName} - ${userAgent}`);
    setIndexedDBAvailable(isIndexedDBAvailable);
  }, []);

  // Test simple d'IndexedDB
  const testIndexedDB = () => {
    if (!indexedDBAvailable) {
      setIndexedDBTest({
        status: 'error',
        message: 'IndexedDB n\'est pas disponible dans ce navigateur'
      });
      return;
    }

    setIndexedDBTest({
      status: 'pending',
      message: 'Test en cours...'
    });

    try {
      const dbName = 'testDatabase';
      const dbVersion = 1;
      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = (event) => {
        console.error('Erreur lors de l\'ouverture de la base de données', event);
        setIndexedDBTest({
          status: 'error',
          message: `Erreur lors de l'ouverture de la base de données: ${(event.target as any)?.error?.message || 'Erreur inconnue'}`
        });
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('testStore')) {
          db.createObjectStore('testStore', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Essayer d'écrire des données
        const transaction = db.transaction(['testStore'], 'readwrite');
        const store = transaction.objectStore('testStore');
        
        const testData = { id: 1, value: 'Test value', timestamp: new Date().toISOString() };
        const addRequest = store.put(testData);
        
        addRequest.onsuccess = () => {
          // Essayer de lire les données
          const readTransaction = db.transaction(['testStore'], 'readonly');
          const readStore = readTransaction.objectStore('testStore');
          const getRequest = readStore.get(1);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              setIndexedDBTest({
                status: 'success',
                message: `Test réussi! Données lues: ${JSON.stringify(getRequest.result)}`
              });
            } else {
              setIndexedDBTest({
                status: 'error',
                message: 'Données non trouvées après écriture'
              });
            }
          };
          
          getRequest.onerror = (getEvent) => {
            setIndexedDBTest({
              status: 'error',
              message: `Erreur lors de la lecture: ${(getEvent.target as any)?.error?.message || 'Erreur inconnue'}`
            });
          };
        };
        
        addRequest.onerror = (addEvent) => {
          setIndexedDBTest({
            status: 'error',
            message: `Erreur lors de l'écriture: ${(addEvent.target as any)?.error?.message || 'Erreur inconnue'}`
          });
        };
        
        // Fermer la base de données quand c'est terminé
        transaction.oncomplete = () => {
          db.close();
        };
      };
    } catch (error) {
      setIndexedDBTest({
        status: 'error',
        message: `Exception: ${(error as Error).message}`
      });
    }
  };

  // Test simple de localStorage
  const testLocalStorage = () => {
    setLocalStorageTest({
      status: 'pending',
      message: 'Test en cours...'
    });

    try {
      const testKey = 'test_key';
      const testValue = 'test_value_' + Date.now();
      
      // Écrire
      localStorage.setItem(testKey, testValue);
      
      // Lire
      const readValue = localStorage.getItem(testKey);
      
      if (readValue === testValue) {
        setLocalStorageTest({
          status: 'success',
          message: `Test réussi! Valeur écrite: "${testValue}", Valeur lue: "${readValue}"`
        });
      } else {
        setLocalStorageTest({
          status: 'error',
          message: `Valeurs différentes - Écrite: "${testValue}", Lue: "${readValue}"`
        });
      }
      
      // Nettoyer
      localStorage.removeItem(testKey);
    } catch (error) {
      setLocalStorageTest({
        status: 'error',
        message: `Exception: ${(error as Error).message}`
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Page de test basique</CardTitle>
          <CardDescription>
            Cette page teste les fonctionnalités de base de votre navigateur sans dépendre d'IndexedDB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant={indexedDBAvailable ? "default" : "destructive"} className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Informations du navigateur</AlertTitle>
              <AlertDescription>
                <div className="mt-2 text-sm">
                  <p><strong>User Agent:</strong> {browserInfo}</p>
                  <p><strong>IndexedDB disponible:</strong> {indexedDBAvailable === null ? 'Vérification...' : indexedDBAvailable ? 'Oui' : 'Non'}</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test d'IndexedDB</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant={
                    indexedDBTest.status === 'pending' ? "default" : 
                    indexedDBTest.status === 'success' ? "default" : "destructive"
                  }>
                    <AlertTitle>Statut: {
                      indexedDBTest.status === 'pending' ? 'En attente' : 
                      indexedDBTest.status === 'success' ? 'Succès' : 'Erreur'
                    }</AlertTitle>
                    <AlertDescription className="mt-2 text-sm">
                      {indexedDBTest.message}
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <Button onClick={testIndexedDB} disabled={!indexedDBAvailable}>
                    Tester IndexedDB
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test de localStorage</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant={
                    localStorageTest.status === 'pending' ? "default" : 
                    localStorageTest.status === 'success' ? "default" : "destructive"
                  }>
                    <AlertTitle>Statut: {
                      localStorageTest.status === 'pending' ? 'En attente' : 
                      localStorageTest.status === 'success' ? 'Succès' : 'Erreur'
                    }</AlertTitle>
                    <AlertDescription className="mt-2 text-sm">
                      {localStorageTest.message}
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <Button onClick={testLocalStorage}>
                    Tester localStorage
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          <p className="text-sm text-muted-foreground">
            Cette page est utilisée pour diagnostiquer les problèmes de base sans dépendre de l'infrastructure complète de l'application.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.location.href = '#/'}>
              Retour à l'accueil
            </Button>
            <Button onClick={() => window.location.reload()}>
              Rafraîchir la page
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liens utiles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li><a href="#/" className="text-primary hover:underline">Page d'accueil</a></li>
            <li><a href="#/test-indexeddb" className="text-primary hover:underline">Page de test IndexedDB complète</a></li>
            <li><a href="#/login" className="text-primary hover:underline">Page de connexion</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicTestPage;