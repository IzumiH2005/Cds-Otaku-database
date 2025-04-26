
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Save, X } from "lucide-react";
import { updateFlashcard, deleteFlashcard, Flashcard, getBase64 } from "@/lib/localStorage";
import FlashCard from "./FlashCard";

interface FlashCardItemProps {
  card: Flashcard;
  onDelete?: () => void;
  onUpdate?: (card: Flashcard) => void;
}

const FlashCardItem = ({ card, onDelete, onUpdate }: FlashCardItemProps) => {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFrontAdditionalInfo, setShowFrontAdditionalInfo] = useState(!!card.front.additionalInfo);
  const [showBackAdditionalInfo, setShowBackAdditionalInfo] = useState(!!card.back.additionalInfo);
  const [editingCard, setEditingCard] = useState({
    front: { 
      text: card.front.text,
      image: card.front.image,
      audio: card.front.audio,
      additionalInfo: card.front.additionalInfo || ""
    },
    back: { 
      text: card.back.text,
      image: card.back.image,
      audio: card.back.audio,
      additionalInfo: card.back.additionalInfo || ""
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
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
      if (side === 'front') {
        setEditingCard({
          ...editingCard,
          front: { ...editingCard.front, image: base64 },
        });
      } else {
        setEditingCard({
          ...editingCard,
          back: { ...editingCard.back, image: base64 },
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image",
        variant: "destructive",
      });
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier audio ne doit pas dépasser 10 Mo",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner un fichier audio",
          variant: "destructive",
        });
        return;
      }

      const base64 = await getBase64(file);
      if (side === 'front') {
        setEditingCard({
          ...editingCard,
          front: { ...editingCard.front, audio: base64 },
        });
      } else {
        setEditingCard({
          ...editingCard,
          back: { ...editingCard.back, audio: base64 },
        });
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le fichier audio",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = () => {
    if (!editingCard.front.text.trim() && !editingCard.front.image) {
      toast({
        title: "Contenu requis",
        description: "Veuillez ajouter du texte ou une image au recto de la carte",
        variant: "destructive",
      });
      return;
    }

    if (!editingCard.back.text.trim() && !editingCard.back.image) {
      toast({
        title: "Contenu requis",
        description: "Veuillez ajouter du texte ou une image au verso de la carte",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedFront = {
        text: editingCard.front.text.trim(),
        image: editingCard.front.image,
        audio: editingCard.front.audio,
        additionalInfo: showFrontAdditionalInfo ? editingCard.front.additionalInfo.trim() : undefined
      };

      const updatedBack = {
        text: editingCard.back.text.trim(),
        image: editingCard.back.image,
        audio: editingCard.back.audio,
        additionalInfo: showBackAdditionalInfo ? editingCard.back.additionalInfo.trim() : undefined
      };

      const updated = updateFlashcard(card.id, {
        front: updatedFront,
        back: updatedBack,
      });

      if (updated) {
        setShowEditDialog(false);
        onUpdate?.(updated);
        toast({
          title: "Carte mise à jour",
          description: "La flashcard a été modifiée avec succès",
        });
      }
    } catch (error) {
      console.error("Error updating flashcard:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la flashcard",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    try {
      const success = deleteFlashcard(card.id);
      if (success) {
        setShowDeleteDialog(false);
        onDelete?.();
        toast({
          title: "Carte supprimée",
          description: "La flashcard a été supprimée avec succès",
        });
      }
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la flashcard",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-0">
          <FlashCard {...card} />
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier la flashcard</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4 border p-4 rounded-lg">
              <h3 className="font-medium">Recto de la carte</h3>
              <div className="space-y-2">
                <Label htmlFor="front-text">Texte</Label>
                <Textarea
                  id="front-text"
                  rows={3}
                  value={editingCard.front.text}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      front: { ...editingCard.front, text: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="front-image">Image (optionnelle)</Label>
                <Input
                  id="front-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'front')}
                />
                {editingCard.front.image && (
                  <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border">
                    <img
                      src={editingCard.front.image}
                      alt="Front side"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full"
                      onClick={() => setEditingCard({
                        ...editingCard,
                        front: { ...editingCard.front, image: undefined },
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="front-audio">Audio (optionnel)</Label>
                <Input
                  id="front-audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleAudioUpload(e, 'front')}
                />
                {editingCard.front.audio && (
                  <div className="mt-2 relative">
                    <audio className="w-full" controls>
                      <source src={editingCard.front.audio} />
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 right-2 w-6 h-6 rounded-full"
                      onClick={() => setEditingCard({
                        ...editingCard,
                        front: { ...editingCard.front, audio: undefined },
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="show-front-additional-info" 
                  checked={showFrontAdditionalInfo}
                  onCheckedChange={(checked) => {
                    setShowFrontAdditionalInfo(checked as boolean);
                  }}
                />
                <Label htmlFor="show-front-additional-info">Ajouter des informations supplémentaires</Label>
              </div>

              {showFrontAdditionalInfo && (
                <div className="space-y-2">
                  <Label htmlFor="front-additional-info">Informations supplémentaires</Label>
                  <Textarea
                    id="front-additional-info"
                    rows={3}
                    value={editingCard.front.additionalInfo}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        front: { ...editingCard.front, additionalInfo: e.target.value },
                      })
                    }
                    placeholder="Ajoutez des notes, contexte ou détails complémentaires..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 border p-4 rounded-lg">
              <h3 className="font-medium">Verso de la carte</h3>
              <div className="space-y-2">
                <Label htmlFor="back-text">Texte</Label>
                <Textarea
                  id="back-text"
                  rows={3}
                  value={editingCard.back.text}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      back: { ...editingCard.back, text: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="back-image">Image (optionnelle)</Label>
                <Input
                  id="back-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'back')}
                />
                {editingCard.back.image && (
                  <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border">
                    <img
                      src={editingCard.back.image}
                      alt="Back side"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full"
                      onClick={() => setEditingCard({
                        ...editingCard,
                        back: { ...editingCard.back, image: undefined },
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="back-audio">Audio (optionnel)</Label>
                <Input
                  id="back-audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleAudioUpload(e, 'back')}
                />
                {editingCard.back.audio && (
                  <div className="mt-2 relative">
                    <audio className="w-full" controls>
                      <source src={editingCard.back.audio} />
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 right-2 w-6 h-6 rounded-full"
                      onClick={() => setEditingCard({
                        ...editingCard,
                        back: { ...editingCard.back, audio: undefined },
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="show-back-additional-info" 
                  checked={showBackAdditionalInfo}
                  onCheckedChange={(checked) => {
                    setShowBackAdditionalInfo(checked as boolean);
                  }}
                />
                <Label htmlFor="show-back-additional-info">Ajouter des informations supplémentaires</Label>
              </div>

              {showBackAdditionalInfo && (
                <div className="space-y-2">
                  <Label htmlFor="back-additional-info">Informations supplémentaires</Label>
                  <Textarea
                    id="back-additional-info"
                    rows={3}
                    value={editingCard.back.additionalInfo}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        back: { ...editingCard.back, additionalInfo: e.target.value },
                      })
                    }
                    placeholder="Ajoutez des notes, contexte ou détails complémentaires..."
                  />
                </div>
              )}
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
            <DialogTitle>Supprimer la carte</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette flashcard ? Cette action est irréversible.
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

export default FlashCardItem;
