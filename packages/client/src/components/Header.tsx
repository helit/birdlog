import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="mb-4 flex items-center justify-between border-b pb-3">
      <h1 className="text-lg font-bold">BirdLog</h1>
      <Button variant="ghost" size="icon" onClick={logout}>
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
};

export default Header;
