import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { MY_STATS } from "@/graphql/queries";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { BinocularsIcon, BirdIcon, CalendarIcon, ChevronRightIcon, KeyRoundIcon, LogOutIcon, UserIcon } from "lucide-react";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { data, error } = useQuery(MY_STATS);
  const stats = data?.myStats;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <UserIcon className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{user?.name}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {error && (
        <p className="text-center text-sm text-muted-foreground">Kunde inte hämta statistik.</p>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-card px-2 py-3 shadow-sm">
            <BinocularsIcon className="size-5 text-primary" />
            <p className="text-xl font-bold">{stats.totalSightings}</p>
            <p className="text-[11px] text-muted-foreground">Observationer</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-card px-2 py-3 shadow-sm">
            <BirdIcon className="size-5 text-primary" />
            <p className="text-xl font-bold">{stats.uniqueSpecies}</p>
            <p className="text-[11px] text-muted-foreground">Arter</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-card px-2 py-3 shadow-sm">
            <CalendarIcon className="size-5 text-primary" />
            <p className="text-sm font-bold">{format(new Date(stats.memberSince), "MMM yyyy", { locale: sv })}</p>
            <p className="text-[11px] text-muted-foreground">Medlem sedan</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <button
          className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left active:bg-muted/50"
          disabled
        >
          <UserIcon className="size-5 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">Redigera profil</span>
          <span className="text-xs text-muted-foreground">Kommer snart</span>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </button>
        <button
          className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/50"
          disabled
        >
          <KeyRoundIcon className="size-5 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">Byt lösenord</span>
          <span className="text-xs text-muted-foreground">Kommer snart</span>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </button>
      </div>

      <Button variant="outline" className="w-full" onClick={logout}>
        <LogOutIcon className="size-4" />
        Logga ut
      </Button>
    </div>
  );
};

export default ProfilePage;
