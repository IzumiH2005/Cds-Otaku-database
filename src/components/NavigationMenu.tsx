
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import React from "react";
import { BookOpen, Lightbulb, Settings, Share2, TrendingUp, Folder } from "lucide-react";
import { hasSession } from "@/lib/sessionManager";

interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  external?: boolean;
}

const studyResources: NavItem[] = [
  {
    title: "Consulter les decks",
    href: "/explore",
    description: "Parcourir tous les decks disponibles pour étudier",
    icon: <BookOpen className="h-5 w-5 text-indigo-500" />,
  },
  {
    title: "Méthodes d'apprentissage",
    href: "/learning-methods",
    description: "Découvrir les meilleures techniques d'apprentissage",
    icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
  },
  {
    title: "Statistiques d'apprentissage",
    href: "/stats",
    description: "Suivre votre progression et vos performances",
    icon: <TrendingUp className="h-5 w-5 text-green-500" />,
  },
];

const resourcesItems: NavItem[] = [
  {
    title: "Paramètres",
    href: "/profile",
    description: "Gérer votre profil et vos préférences",
    icon: <Settings className="h-5 w-5 text-slate-500" />,
  },
  {
    title: "Partager",
    href: "/share",
    description: "Partager vos decks et votre progression",
    icon: <Share2 className="h-5 w-5 text-blue-500" />,
  },
  {
    title: "Mes Decks",
    href: "/my-decks",
    description: "Voir tous vos decks personnels",
    icon: <Folder className="h-5 w-5 text-blue-500" />,
  },
];

export function AppNavigationMenu() {
  const location = useLocation();
  
  // Don't render navigation menu if user is not logged in
  if (!hasSession()) {
    return null;
  }
  
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Étudier</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {studyResources.map((resource) => (
                <ListItem
                  key={resource.title}
                  title={resource.title}
                  href={resource.href}
                  icon={resource.icon}
                  isActive={location.pathname === resource.href}
                >
                  {resource.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Ressources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
              {resourcesItems.map((resource) => (
                <ListItem
                  key={resource.title}
                  title={resource.title}
                  href={resource.href}
                  icon={resource.icon}
                  isActive={location.pathname === resource.href}
                >
                  {resource.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/create">
            <NavigationMenuLink className={cn(
              navigationMenuTriggerStyle(), 
              "bg-transparent",
              location.pathname === "/create" && "bg-accent text-accent-foreground"
            )}>
              Créer
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { 
    icon?: React.ReactNode;
    isActive?: boolean;
  }
>(({ className, title, icon, children, isActive, ...props }, ref) => {
  return (
    <li>
      <Link
        to={props.href || "#"}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-sm font-medium leading-none">{title}</div>
        </div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </Link>
    </li>
  );
});
ListItem.displayName = "ListItem";
