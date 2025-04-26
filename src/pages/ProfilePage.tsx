
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initializeDefaultUser, getUser, updateUser, getBase64 } from "@/lib/localStorage";
import { getSessionKey, getSessionStats, exportSessionData, importSessionData } from "@/lib/sessionManager";
import { Loader2, Save, Download, Upload, Clock, Award, Calendar, BarChart2, Zap } from "lucide-react";

const ProfilePage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({});
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | undefined>();
  const [exportFile, setExportFile] = useState<string | null>(null);
  const [importData, setImportData] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get session key
        const key = getSessionKey();
        setSessionKey(key);

        // Get user stats
        const userStats = getSessionStats();
        setStats(userStats);

        // Make sure we have a user
        let userData = await getUser();
        if (!userData) {
          userData = await initializeDefaultUser();
        }
        
        setUser(userData);
        setEditName(userData.name);
        setEditBio(userData.bio || "");
        setEditAvatar(userData.avatar);

        setLoading(false);
      } catch (error) {
        console.error("Error loading profile data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du profil",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [toast]);

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await updateUser({
        name: editName,
        bio: editBio,
        avatar: editAvatar,
      });

      if (updatedUser) {
        setUser(updatedUser);
        setEditingProfile(false);
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été enregistrées avec succès",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 5 Mo",
          variant: "destructive",
        });
        return;
      }

      const base64 = await getBase64(file);
      setEditAvatar(base64);
    } catch (error) {
      console.error("Error processing avatar:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    try {
      const exportedData = exportSessionData();
      
      // Create a Blob from the JSON string
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      setExportFile(url);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcard-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      
      toast({
        title: "Données exportées",
        description: "Toutes vos données ont été exportées avec succès",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportData(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = () => {
    if (!importData) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner un fichier de sauvegarde",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = importSessionData(importData);
      if (success) {
        // Refresh page to load imported data
        window.location.reload();
        
        toast({
          title: "Données importées",
          description: "Toutes vos données ont été importées avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Le format du fichier est incorrect",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer les données",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Chargement...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className="flex flex-col-reverse md:flex-row gap-6">
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profil Utilisateur</CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {editingProfile ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                          id="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editBio}
                          rows={4}
                          onChange={(e) => setEditBio(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar</Label>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                        
                        {editAvatar && (
                          <div className="mt-2 flex justify-center">
                            <img
                              src={editAvatar}
                              alt="Avatar Preview"
                              className="w-20 h-20 object-cover rounded-full"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingProfile(false);
                            setEditName(user.name);
                            setEditBio(user.bio || "");
                            setEditAvatar(user.avatar);
                          }}
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleUpdateProfile}>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Nom</h3>
                        <p className="text-lg">{user.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                        <p className="text-base">{user.bio || "Aucune bio définie."}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Clé de session</h3>
                        <Badge variant="outline" className="font-mono">
                          {sessionKey || "Non connecté"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cette clé permet d'identifier votre session. Ne la partagez avec personne.
                        </p>
                      </div>
                      
                      <Button onClick={() => setEditingProfile(true)}>
                        Modifier le profil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Avatar</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-32 h-32 object-cover rounded-full shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-4xl font-bold text-primary shadow-lg">
                      {user.name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <p className="mt-4 text-xl font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Membre depuis{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestion des données</CardTitle>
              <CardDescription>
                Exportez et importez vos données de flashcards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Exporter les données
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une sauvegarde de toutes vos données (decks, flashcards, statistiques, etc.)
                  </p>
                  <Button onClick={handleExportData}>
                    Télécharger les données
                  </Button>
                </div>
                
                <div className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Importer les données
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Restaurez vos données à partir d'une sauvegarde précédente
                  </p>
                  <div className="space-y-2">
                    <Input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportFileChange} 
                    />
                    <Button onClick={handleImportData} disabled={!importData}>
                      Importer les données
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques d'apprentissage</CardTitle>
              <CardDescription>
                Visualisez votre progression et vos performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-accent/10 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent" />
                        <p className="text-sm text-muted-foreground">Temps d'étude</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {Math.floor(stats.totalStudyTime / 60)} h {stats.totalStudyTime % 60} min
                      </p>
                    </div>
                    
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <p className="text-sm text-muted-foreground">Sessions</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {stats.studySessions || 0}
                      </p>
                    </div>
                    
                    <div className="bg-secondary/10 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-secondary" />
                        <p className="text-sm text-muted-foreground">Cartes étudiées</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {stats.cardsReviewed || 0}
                      </p>
                    </div>
                    
                    <div className="bg-green-500/10 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-muted-foreground">Jours consécutifs</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {stats.streakDays || 0} jours
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Performance moyenne</Label>
                      <span className="text-sm font-medium">{stats.averageScore || 0}%</span>
                    </div>
                    <Progress value={stats.averageScore || 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Répartition des réponses</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>Correctes</span>
                          <span>{stats.correctAnswers || 0}</span>
                        </div>
                        <Progress
                          value={stats.cardsReviewed ? (stats.correctAnswers / stats.cardsReviewed) * 100 : 0}
                          className="h-2 mt-1 bg-muted"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>Incorrectes</span>
                          <span>{stats.incorrectAnswers || 0}</span>
                        </div>
                        <Progress
                          value={stats.cardsReviewed ? (stats.incorrectAnswers / stats.cardsReviewed) * 100 : 0}
                          className="h-2 mt-1 bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Aucune statistique disponible. Commencez à étudier pour voir vos performances !
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
