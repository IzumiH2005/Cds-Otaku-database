
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Layers, ArrowRight, Edit, Trash2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { updateTheme, deleteTheme, Theme } from "@/lib/localStorage";

export interface ThemeCardProps {
  id: string;
  deckId: string;
  title: string;
  description: string;
  cardCount: number;
  coverImage?: string;
  onDelete?: () => void;
  onUpdate?: (theme: Theme) => void;
}

const ThemeCard = ({
  id,
  deckId,
  title,
  description,
  cardCount,
  coverImage,
  onDelete,
  onUpdate,
}: ThemeCardProps) => {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState({
    title,
    description,
  });

  const handleUpdate = () => {
    if (!editingTheme.title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez saisir un titre pour le thème",
        variant: "destructive",
      });
      return;
    }

    try {
      const updated = updateTheme(id, {
        title: editingTheme.title.trim(),
        description: editingTheme.description.trim(),
      });

      if (updated) {
        setShowEditDialog(false);
        onUpdate?.(updated);
        toast({
          title: "Thème mis à jour",
          description: "Le thème a été modifié avec succès",
        });
      }
    } catch (error) {
      console.error("Error updating theme:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le thème",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    try {
      const success = deleteTheme(id);
      if (success) {
        setShowDeleteDialog(false);
        onDelete?.();
        toast({
          title: "Thème supprimé",
          description: "Le thème a été supprimé avec succès",
        });
      }
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le thème",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        {coverImage ? (
          <div className="relative h-32 w-full overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-2 text-white">
              <span className="text-xs font-medium">{cardCount} cartes</span>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-accent/30 to-primary/30 flex items-center justify-center relative">
            <Layers className="h-12 w-12 text-primary/50" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <Link to={`/deck/${deckId}/theme/${id}`}>
          <CardHeader className="p-4">
            <CardTitle className="line-clamp-1 text-base">{title}</CardTitle>
            <CardDescription className="line-clamp-2 text-xs">
              {description}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between p-4 pt-0">
            {!coverImage && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Layers className="h-3 w-3" />
                <span>{cardCount} cartes</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs text-primary hover:text-primary/80">
              <span>Explorer</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </CardFooter>
        </Link>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le thème</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editingTheme.title}
                onChange={(e) => setEditingTheme({ ...editingTheme, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editingTheme.description}
                onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le thème</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le thème "{title}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ThemeCard;
