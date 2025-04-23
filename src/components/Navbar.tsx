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
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-1">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl sm:text-2xl">🎭</span>
            <h1 className="text-sm font-bold sm:hidden">CDS</h1>
            <h1 className="hidden text-base font-bold sm:inline-block">CDS FLASHCARD-BASE</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
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

        <div className="flex items-center gap-2">
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
            className="h-9 w-9 md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="container pb-3 md:hidden px-2">
          <nav className="flex flex-col space-y-2">
            <div className="flex items-center justify-between py-2 border-b mb-1 pb-2">
              <span className="text-xs font-medium">Mode d'affichage:</span>
              <DisplayModeToggle />
            </div>
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${location.pathname === '/' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            <Link 
              to="/explore" 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${location.pathname === '/explore' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Search className="h-4 w-4" />
              Explorer
            </Link>
            <Link 
              to="/create" 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${location.pathname === '/create' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Plus className="h-4 w-4" />
              Créer
            </Link>
            <Link 
              to="/profile" 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${location.pathname === '/profile' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <User className="h-4 w-4" />
              Profil
            </Link>
            <Link 
              to="/my-decks" 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${location.pathname === '/my-decks' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={toggleMenu}
            >
              <Folder className="h-4 w-4" />
              Mes Decks
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
