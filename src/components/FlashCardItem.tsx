
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
      console.log(`Traitement du fichier audio pour le côté ${side}:`, file.name, file.type, file.size);
      
      // Vérifier si le fichier est un type audio reconnu
      const supportedAudioTypes = [
        "audio/mpeg", "audio/mp3", "audio/mp4", "audio/ogg", 
        "audio/wav", "audio/x-wav", "audio/webm", "audio/aac"
      ];
      
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner un fichier audio (format audio/*)",
          variant: "destructive",
        });
        // Réinitialiser l'input
        e.target.value = "";
        return;
      }
      
      if (!supportedAudioTypes.includes(file.type)) {
        console.warn("Type audio non standard:", file.type);
        toast({
          title: "Format d'audio non standard",
          description: "Ce format audio pourrait ne pas être pris en charge par tous les navigateurs. Nous recommandons MP3, WAV ou OGG.",
        });
      }
      
      // Vérification de la taille du fichier - ajustée à 5 Mo maximum
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5Mo
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier audio ne doit pas dépasser 5 Mo (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} Mo)`,
          variant: "destructive",
        });
        // Réinitialiser l'input
        e.target.value = "";
        return;
      }

      toast({
        title: "Traitement en cours...",
        description: "Veuillez patienter pendant le traitement du fichier audio",
      });

      console.log("Conversion du fichier audio en base64...");
      const base64 = await getBase64(file);
      console.log("Taille de la chaîne base64:", base64.length);
      
      // Faire une copie de l'état actuel
      const updatedCard = JSON.parse(JSON.stringify(editingCard));
      
      // Mettre à jour le côté approprié
      if (side === 'front') {
        updatedCard.front = { ...updatedCard.front, audio: base64 };
        console.log("Audio ajouté au recto de la carte");
      } else {
        updatedCard.back = { ...updatedCard.back, audio: base64 };
        console.log("Audio ajouté au verso de la carte");
      }
      
      // Mettre à jour l'état
      setEditingCard(updatedCard);
      
      // Vérification après mise à jour de l'état
      console.log(`Audio ${side} après mise à jour:`, side === 'front' ? 
        (updatedCard.front.audio ? "présent" : "absent") : 
        (updatedCard.back.audio ? "présent" : "absent"));
      
      toast({
        title: "Fichier audio ajouté",
        description: "Le fichier audio a été ajouté avec succès et sera enregistré avec la carte",
      });
      
      // Réinitialiser l'input pour permettre de sélectionner à nouveau le même fichier si nécessaire
      e.target.value = "";
      
    } catch (error: any) {
      console.error("Error processing audio:", error);
      
      // Réinitialiser l'input
      e.target.value = "";
      
      // Afficher un message spécifique si possible
      const errorMessage = error.message || "Impossible de traiter le fichier audio";
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdate = () => {
    // Validation du contenu minimum
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
      // Notification de début de mise à jour
      toast({
        title: "Mise à jour en cours",
        description: "Veuillez patienter pendant l'enregistrement de la carte...",
      });
      
      // Logging pour le débogage
      console.log("Front audio avant mise à jour:", editingCard.front.audio ? `présent (${editingCard.front.audio.length} caractères)` : "absent");
      console.log("Back audio avant mise à jour:", editingCard.back.audio ? `présent (${editingCard.back.audio.length} caractères)` : "absent");
      
      // Vérification de la taille des fichiers audio pour éviter les problèmes de stockage
      let frontAudio = editingCard.front.audio;
      let backAudio = editingCard.back.audio;
      
      // Limite de taille pour les fichiers audio en base64 (environ 2MB)
      const MAX_AUDIO_SIZE = 2 * 1024 * 1024;
      
      // Vérifier et nettoyer les données audio si elles sont trop volumineuses
      if (frontAudio && frontAudio.length > MAX_AUDIO_SIZE) {
        console.warn(`Audio du recto trop volumineux (${(frontAudio.length/1024/1024).toFixed(2)}MB), risque d'échec d'enregistrement`);
        toast({
          title: "Attention",
          description: "Le fichier audio du recto est très volumineux, l'enregistrement pourrait échouer.",
          variant: "destructive",
        });
      }
      
      if (backAudio && backAudio.length > MAX_AUDIO_SIZE) {
        console.warn(`Audio du verso trop volumineux (${(backAudio.length/1024/1024).toFixed(2)}MB), risque d'échec d'enregistrement`);
        toast({
          title: "Attention",
          description: "Le fichier audio du verso est très volumineux, l'enregistrement pourrait échouer.",
          variant: "destructive",
        });
      }
      
      // Création des objets mis à jour avec des données nettoyées
      const updatedFront = {
        text: editingCard.front.text.trim(),
        image: editingCard.front.image,
        audio: frontAudio,
        additionalInfo: showFrontAdditionalInfo ? editingCard.front.additionalInfo?.trim() : undefined
      };

      const updatedBack = {
        text: editingCard.back.text.trim(),
        image: editingCard.back.image,
        audio: backAudio,
        additionalInfo: showBackAdditionalInfo ? editingCard.back.additionalInfo?.trim() : undefined
      };

      // Tenter la mise à jour avec les données optimisées
      console.log("Tentative de mise à jour de la carte...");
      const updated = updateFlashcard(card.id, {
        front: updatedFront,
        back: updatedBack,
      });

      if (updated) {
        // Vérifier que la carte mise à jour contient bien les données audio
        console.log("Carte mise à jour avec succès");
        console.log("Front audio après mise à jour:", updated.front.audio ? "présent" : "absent");
        console.log("Back audio après mise à jour:", updated.back.audio ? "présent" : "absent");
        
        // Si les données audio sont manquantes dans la carte mise à jour, avertir l'utilisateur
        if ((frontAudio && !updated.front.audio) || (backAudio && !updated.back.audio)) {
          console.warn("Certains fichiers audio n'ont pas pu être enregistrés");
          toast({
            title: "Carte mise à jour partiellement",
            description: "La carte a été mise à jour, mais certains fichiers audio n'ont pas pu être enregistrés en raison de leur taille.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Carte mise à jour",
            description: "La flashcard a été modifiée avec succès",
          });
        }
        
        setShowEditDialog(false);
        onUpdate?.(updated);
      } else {
        console.error("La carte n'a pas été mise à jour correctement");
        
        // En cas d'échec, tenter une seconde fois sans les fichiers audio
        console.log("Tentative de mise à jour sans les fichiers audio...");
        
        const fallbackFront = { ...updatedFront, audio: undefined };
        const fallbackBack = { ...updatedBack, audio: undefined };
        
        const fallbackUpdated = updateFlashcard(card.id, {
          front: fallbackFront,
          back: fallbackBack,
        });
        
        if (fallbackUpdated) {
          console.log("Mise à jour réussie sans les fichiers audio");
          toast({
            title: "Carte mise à jour partiellement",
            description: "La carte a été enregistrée, mais sans les fichiers audio qui étaient trop volumineux.",
            variant: "destructive",
          });
          
          setShowEditDialog(false);
          onUpdate?.(fallbackUpdated);
        } else {
          toast({
            title: "Erreur",
            description: "La mise à jour de la flashcard a échoué. Essayez de réduire la taille des médias ou de les supprimer.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error updating flashcard:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la flashcard. Vérifiez la taille des fichiers audio et images.",
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
      <div className="group relative">
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <FlashCard {...card} />
      </div>

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

              {/* Option d'informations supplémentaires retirée */}
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

              {/* Option d'informations supplémentaires retirée */}
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
