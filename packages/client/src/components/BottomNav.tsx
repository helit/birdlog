import { cn } from "@/lib/utils";
import {
  BinocularsIcon,
  BirdIcon,
  CircleQuestionMarkIcon,
  UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "Identifiera", Icon: CircleQuestionMarkIcon },
  { to: "/sightings", label: "Observationer", Icon: BinocularsIcon },
  { to: "/life-list", label: "Fågellista", Icon: BirdIcon },
  { to: "/profile", label: "Profil", Icon: UserIcon },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1100] bg-card shadow-[0_-1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around" role="tablist">
        {tabs.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            role="tab"
            aria-label={label}
            aria-selected={isActive(to)}
            className={cn(
              "relative flex flex-1 flex-col items-center px-2 py-3",
              isActive(to)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon />
            {isActive(to) && (
              <span className="absolute bottom-0 h-0.5 w-full bg-primary" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
