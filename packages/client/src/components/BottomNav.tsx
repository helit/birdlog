import { cn } from "@/lib/utils";
import {
  BinocularsIcon,
  BirdIcon,
  BookOpenIcon,
  CircleQuestionMarkIcon,
  UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "Identifiera", Icon: CircleQuestionMarkIcon },
  { to: "/sightings", label: "Observationer", Icon: BinocularsIcon },
  { to: "/life-list", label: "Fågellista", Icon: BirdIcon },
  { to: "/guidebook", label: "Fågelbok", Icon: BookOpenIcon, prefix: true },
  { to: "/profile", label: "Profil", Icon: UserIcon },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  const isActive = (tab: { to: string; prefix?: boolean }) =>
    tab.prefix ? pathname === tab.to || pathname.startsWith(tab.to + "/") : pathname === tab.to;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1100] bg-card shadow-[0_-1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around" role="tablist">
        {tabs.map((tab) => {
          const { to, label, Icon } = tab;
          const active = isActive(tab);
          return (
            <Link
              key={to}
              to={to}
              role="tab"
              aria-label={label}
              aria-selected={active}
              className={cn(
                "relative flex flex-1 flex-col items-center px-2 py-3",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon />
              {active && (
                <span className="absolute bottom-0 h-0.5 w-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
