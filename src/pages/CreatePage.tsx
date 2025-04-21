import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PlusIcon, 
  X, 
  Upload, 
  Tag as TagIcon, 
  Save, 
  Lock, 
  Globe 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createDeck, getBase64, getUser } from "@/lib/localStorage";

const CreatePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 5 Mo",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner une image (JPEG, PNG, GIF, etc.)",
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

  const removeCoverImage = () => {
    setCoverImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleCreateDeck = () => {
    if (!title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez saisir un titre pour votre deck",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = getUser()?.id || "anonymous";

      const newDeck = createDeck({
        title: title.trim(),
        description: description.trim(),
        coverImage,
        authorId: userId,
        isPublic,
        tags: tags.length > 0 ? tags : ["Non classé"],
      });

      toast({
        title: "Deck créé avec succès",
        description: "Vous pouvez maintenant ajouter des flashcards à votre deck",
      });

      // Navigate to the deck page
      navigate(`/deck/${newDeck.id}`);
    } catch (error) {
      console.error("Error creating deck:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le deck",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Créer un Nouveau Deck</h1>
        <p className="text-muted-foreground mb-8">
          Commencez par définir les informations de base de votre deck de flashcards
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Informations du Deck</CardTitle>
            <CardDescription>
              Entrez les détails pour votre nouveau deck de flashcards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Ex: Vocabulaire Espagnol"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Une brève description de votre deck..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Image de couverture</Label>
              {coverImage ? (
                <div className="relative w-full h-40 rounded-md overflow-hidden border">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full"
                    onClick={removeCoverImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md border-muted-foreground/30">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <Label
                      htmlFor="cover-image"
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      Choisir une image
                    </Label>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Format recommandé: JPG, PNG. Taille maximale: 5 Mo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Ajoutez un tag et appuyez sur Entrée"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button variant="outline" onClick={addTag} disabled={!newTag.trim()}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Ajoutez des tags pour catégoriser votre deck
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="isPublic" className="cursor-pointer flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Deck public</span>
                    <span className="text-xs text-muted-foreground">(Visible par tous les utilisateurs)</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-yellow-500" />
                    <span>Deck privé</span>
                    <span className="text-xs text-muted-foreground">(Visible uniquement par vous)</span>
                  </>
                )}
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              Annuler
            </Button>
            <Button onClick={handleCreateDeck}>
              <Save className="mr-2 h-4 w-4" />
              Créer le deck
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreatePage;
