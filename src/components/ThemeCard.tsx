
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
      <Card className="h-full overflow-hidden shadow-none transition-shadow group rounded-lg">
        <Link to={`/deck/${deckId}/theme/${id}`} className="flex flex-col h-full">
          {coverImage ? (
            <div className="relative aspect-[1.8/1] w-full overflow-hidden rounded-t-lg">
              <img
                src={coverImage}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-1 left-2 text-white">
                <span className="text-[10px] font-medium">{cardCount} cartes</span>
              </div>
            </div>
          ) : (
            <div className="aspect-[1.8/1] w-full bg-gray-100 flex items-center justify-center relative rounded-t-lg">
              <Layers className="h-8 w-8 text-gray-400" />
              <div className="absolute bottom-1 left-2 text-gray-600">
                <span className="text-[10px] font-medium">{cardCount} cartes</span>
              </div>
            </div>
          )}
          
          <div className="p-2 flex-grow flex flex-col">
            <div className="flex-grow">
              <h3 className="text-sm font-medium mb-1 line-clamp-1">{title}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
                {description}
              </p>
            </div>
            
            <div className="flex justify-between items-center mt-auto">
              <span className="text-xs text-black font-medium">Explorer</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
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
