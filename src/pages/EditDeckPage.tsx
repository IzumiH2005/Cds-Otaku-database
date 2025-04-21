import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Pencil, 
  Save, 
  X, 
  Trash2, 
  ArrowLeft, 
  Upload, 
  Plus, 
  Minus,
  Globe,
  Lock,
  Tags,
  Share2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

import { 
  getDeck, 
  updateDeck, 
  deleteDeck, 
  getBase64, 
  getUser, 
  Deck
} from "@/lib/localStorage";

import { publishDeck, unpublishDeck, updatePublishedDeck } from "@/lib/localStorage";

const EditDeckPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const deckData = getDeck(id);
    if (!deckData) {
      toast({
        title: "Deck introuvable",
        description: "Le deck que vous cherchez n'existe pas",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    const user = getUser();
    const userIsOwner = deckData.authorId === user?.id;
    
    if (!userIsOwner) {
      toast({
        title: "Accès refusé",
        description: "Vous n'êtes pas autorisé à modifier ce deck",
        variant: "destructive",
      });
      navigate(`/deck/${id}`);
      return;
    }
    
    setDeck(deckData);
    setTitle(deckData.title);
    setDescription(deckData.description);
    setIsPublic(deckData.isPublic);
    setCoverImage(deckData.coverImage);
    setTags(deckData.tags || []);
    setIsOwner(userIsOwner);
    setIsLoading(false);
  }, [id, navigate, toast]);
  
  const handleSave = () => {
    if (!id) return;
    
    if (!title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez saisir un titre pour le deck",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedDeck = updateDeck(id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        coverImage,
        tags,
      });
      
      if (updatedDeck) {
        setDeck(updatedDeck);
        toast({
          title: "Deck mis à jour",
          description: "Les modifications ont été enregistrées avec succès",
        });
        
        navigate(`/deck/${id}`);
      }
    } catch (error) {
      console.error("Error updating deck:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le deck",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteDeck = () => {
    if (!id) return;
    
    try {
      const success = deleteDeck(id);
      
      if (success) {
        toast({
          title: "Deck supprimé",
          description: "Le deck a été supprimé avec succès",
        });
        navigate("/home");
      }
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le deck",
        variant: "destructive",
      });
    }
  };
  
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setCoverImage(base64);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image",
        variant: "destructive",
      });
    }
  };
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    if (tags.includes(newTag.trim())) {
      toast({
        title: "Tag existant",
        description: "Ce tag existe déjà",
        variant: "destructive",
      });
      return;
    }
    
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handlePublishDeck = async () => {
    if (!deck) return;

    setIsPublishing(true);
    setPublishError(null);
    try {
      const published = await publishDeck(deck);
      if (published) {
        toast({
          title: "Deck publié",
          description: "Votre deck est maintenant visible dans l'explorateur",
        });
        
        const updatedDeck = getDeck(id || '');
        if (updatedDeck) {
          setDeck(updatedDeck);
        }
      } else {
        setPublishError("Impossible de publier le deck. Veuillez réessayer.");
        toast({
          title: "Erreur",
          description: "Impossible de publier le deck",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Publication error:", error);
      setPublishError("Une erreur technique s'est produite. Veuillez réessayer.");
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la publication",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishDeck = async () => {
    if (!deck) return;

    setIsUnpublishing(true);
    try {
      const unpublished = await unpublishDeck(deck.id);
      if (unpublished) {
        toast({
          title: "Deck dépublié",
          description: "Votre deck n'est plus visible dans l'explorateur",
        });
        
        const updatedDeck = getDeck(id || '');
        if (updatedDeck) {
          setDeck(updatedDeck);
        }
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de dépublier le deck",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Unpublication error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la dépublication",
        variant: "destructive",
      });
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleUpdatePublishedDeck = async () => {
    if (!deck) return;

    try {
      const updated = await updatePublishedDeck(deck);
      if (updated) {
        toast({
          title: "Deck mis à jour",
          description: "Les modifications ont été synchronisées avec l'explorateur",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le deck publié",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update published deck error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!deck || !isOwner) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas l'autorisation de modifier ce deck.
          </p>
          <Button asChild>
            <Link to="/home">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8">
      <Link to={`/deck/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Retour au deck
      </Link>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Modifier le deck
        </h1>
        <div className="flex gap-2">
          {!deck?.isPublished ? (
            <Button 
              onClick={handlePublishDeck} 
              disabled={isPublishing}
              className="bg-green-500 hover:bg-green-600"
            >
              {isPublishing ? "Publication..." : "Publier"}
              <Globe className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdatePublishedDeck}
                variant="secondary"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Mettre à jour
                <Share2 className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={handleUnpublishDeck} 
                disabled={isUnpublishing}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                {isUnpublishing ? "Dépublication..." : "Dépublier"}
                <Lock className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer le deck
          </Button>
        </div>
      </div>

      {publishError && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md border border-red-200">
          <p className="font-semibold">Erreur de publication :</p>
          <p>{publishError}</p>
        </div>
      )}
      
      <Card className="max-w-4xl mx-auto shadow-md border-indigo-100 dark:border-indigo-900/30">
        <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-lg">
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du deck"
              className="border-indigo-200 dark:border-indigo-800/30 focus-visible:ring-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du deck"
              rows={4}
              className="border-indigo-200 dark:border-indigo-800/30 focus-visible:ring-indigo-500 resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Image de couverture</Label>
            <div className="flex flex-col space-y-4">
              {coverImage ? (
                <div className="relative aspect-video w-full md:w-2/3 rounded-md overflow-hidden border border-indigo-200 dark:border-indigo-800/30 shadow-md">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setCoverImage(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="aspect-video w-full md:w-2/3 border-2 border-dashed border-indigo-200 dark:border-indigo-800/30 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-indigo-400 mb-2" />
                  <p className="text-sm text-muted-foreground">Cliquez pour ajouter une image</p>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleCoverImageUpload}
              />
              <p className="text-xs text-muted-foreground">
                Format recommandé: 16:9. Taille max: 5 Mo.
              </p>
            </div>
          </div>
          
          <Separator className="bg-indigo-100 dark:bg-indigo-800/20" />
          
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800">
                  {tag}
                  <button
                    className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-700"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun tag ajouté</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="border-indigo-200 dark:border-indigo-800/30 focus-visible:ring-indigo-500"
              />
              <Button onClick={handleAddTag} className="bg-indigo-500 hover:bg-indigo-600">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les tags aident les utilisateurs à trouver votre deck plus facilement.
            </p>
          </div>
          
          <Separator className="bg-indigo-100 dark:bg-indigo-800/20" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-switch">Visibilité</Label>
              <div className="text-sm text-muted-foreground">
                {isPublic ? "Ce deck est visible par tous les utilisateurs" : "Ce deck est privé et visible uniquement par vous"}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public-switch"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-indigo-500"
              />
              {isPublic ? (
                <Globe className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 pt-4 pb-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-b-lg">
          <Button variant="outline" asChild className="border-indigo-200 dark:border-indigo-800/30">
            <Link to={`/deck/${id}`}>Annuler</Link>
          </Button>
          <Button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600">
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce deck ? Cette action est irréversible et toutes les cartes associées seront également supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteDeck}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditDeckPage;
