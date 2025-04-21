import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Search, User, Menu, X, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { DisplayModeToggle } from "@/components/DisplayModeToggle";

const Navbar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <h1 className="hidden font-bold sm:inline-block">CDS FLASHCARD-BASE</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Accueil
          </Link>
          <Link to="/explore" className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`}>
            Explorer
          </Link>
          <Link to="/create" className={`nav-link ${location.pathname === '/create' ? 'active' : ''}`}>
            Créer
          </Link>
          <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            Profil
          </Link>
          <Link to="/my-decks" className={`nav-link ${location.pathname === '/my-decks' ? 'active' : ''}`}>
            Mes Decks
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Display Mode Toggle for Desktop */}
          <div className="hidden md:block">
            <DisplayModeToggle />
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => toast({
              title: "Recherche",
              description: "La fonction de recherche sera bientôt disponible",
            })}
            className="hidden md:flex"
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Button asChild variant="default" size="sm" className="hidden md:flex">
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer un deck
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="container pb-4 md:hidden">
          <nav className="flex flex-col space-y-4">
            <div className="flex items-center justify-between py-2 border-b mb-2 pb-3">
              <span className="text-sm font-medium">Mode d'affichage:</span>
              <DisplayModeToggle />
            </div>
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-2 py-2 rounded-md ${location.pathname === '/' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Home className="h-5 w-5" />
              Accueil
            </Link>
            <Link 
              to="/explore" 
              className={`flex items-center gap-2 px-2 py-2 rounded-md ${location.pathname === '/explore' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Search className="h-5 w-5" />
              Explorer
            </Link>
            <Link 
              to="/create" 
              className={`flex items-center gap-2 px-2 py-2 rounded-md ${location.pathname === '/create' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Plus className="h-5 w-5" />
              Créer
            </Link>
            <Link 
              to="/profile" 
              className={`flex items-center gap-2 px-2 py-2 rounded-md ${location.pathname === '/profile' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <User className="h-5 w-5" />
              Profil
            </Link>
            <Link 
              to="/my-decks" 
              className={`flex items-center gap-2 px-2 py-2 rounded-md ${location.pathname === '/my-decks' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Folder className="h-5 w-5" />
              Mes Decks
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
