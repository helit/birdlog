import { cn } from "@/lib/utils";
import { BinocularsIcon, BirdIcon, CircleQuestionMarkIcon, UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const BottomNav = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around">
        <Link
          to="/"
          className={cn(
            "relative flex flex-1 flex-col items-center p-2",
            isActive("/") ? "bg-primary/10 text-primary" : "text-muted-foreground",
          )}
        >
          <CircleQuestionMarkIcon />
          {isActive("/") && <span className="absolute bottom-0 h-0.5 w-full bg-primary" />}
        </Link>
        <Link
          to="/sightings"
          className={cn(
            "relative flex flex-1 flex-col items-center p-2",
            isActive("/sightings") ? "bg-primary/10 text-primary" : "text-muted-foreground",
          )}
        >
          <BinocularsIcon />
          {isActive("/sightings") && <span className="absolute bottom-0 h-0.5 w-full bg-primary" />}
        </Link>
        <Link
          to="/life-list"
          className={cn(
            "relative flex flex-1 flex-col items-center p-2",
            isActive("/life-list") ? "bg-primary/10 text-primary" : "text-muted-foreground",
          )}
        >
          <BirdIcon />
          {isActive("/life-list") && <span className="absolute bottom-0 h-0.5 w-full bg-primary" />}
        </Link>
        <Link
          to="/profile"
          className={cn(
            "relative flex flex-1 flex-col items-center p-2",
            isActive("/profile") ? "bg-primary/10 text-primary" : "text-muted-foreground",
          )}
        >
          <UserIcon />
          {isActive("/profile") && <span className="absolute bottom-0 h-0.5 w-full bg-primary" />}
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
