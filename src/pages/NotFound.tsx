
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  useEffect(() => {
    console.error(
      "404 Error: Page non trouvée"
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
        <AlertCircle className="h-12 w-12 text-white" />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-3 text-white">404</h1>
      <p className="text-xl text-white/90 mb-8 max-w-md">
        Oups! Cette page n'existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/10 shadow-lg text-white">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
        <Button variant="outline" asChild className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-lg">
          <Link to="/explore">
            <Search className="mr-2 h-4 w-4" />
            Explorer les decks
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
