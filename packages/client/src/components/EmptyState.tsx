import { Button } from "@/components/ui/button";
import { BirdIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <BirdIcon className="h-16 w-16 opacity-30" />
      <div className="max-w-56">
        <h2 className="text-lg font-semibold">Här var det tomt!</h2>
        <p className="mt-1 text-sm">
          Börja logga fåglar genom att navigera till startsidan och tryck på något av
          identifikationsmetoderna.
        </p>
        <Button className="mt-4 w-full" size="lg" onClick={() => navigate("/")}>
          Tillbaka till start
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
