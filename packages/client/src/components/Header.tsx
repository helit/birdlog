import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <h1 className="text-lg font-bold">Bird Log</h1>
      <Button variant="ghost" size="icon" onClick={logout}>
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
};

export default Header;
