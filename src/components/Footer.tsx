
import { Link } from "react-router-dom";
import { Github, Heart, Mail, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background/50 py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">CDS FLASHCARD-BASE</h3>
            <p className="text-sm text-muted-foreground">
              Créé avec passion en 2025 par Izumi Hearthcliff pour faciliter l'apprentissage par flashcards.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-muted-foreground hover:text-foreground">
                  Explorer
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-muted-foreground hover:text-foreground">
                  Créer un Deck
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-foreground">
                  Profil
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Ressources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/guide" className="text-muted-foreground hover:text-foreground">
                  Guide d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@cdsflashcard.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Twitter className="h-4 w-4" />
                <span>@cdsflashcard</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Github className="h-4 w-4" />
                <span>github.com/izumi-h</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 CDS FLASHCARD-BASE. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Fait avec</span>
            <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
            <span>par Izumi Hearthcliff</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
