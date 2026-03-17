import { cn } from "@/lib/utils";
import { BinocularsIcon, BirdIcon, PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const BottomNav = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
      <div className="flex justify-around">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center p-2",
            isActive("/") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <BinocularsIcon />
          <span className="text-xs">Observationer</span>
        </Link>
        <Link
          to="/new"
          className={cn(
            "flex flex-col items-center p-2",
            isActive("/new") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <PlusIcon />
          <span className="text-xs">Ny</span>
        </Link>
        <Link
          to="/life-list"
          className={cn(
            "flex flex-col items-center p-2",
            isActive("/life-list") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <BirdIcon />
          <span className="text-xs">Fågellista</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
