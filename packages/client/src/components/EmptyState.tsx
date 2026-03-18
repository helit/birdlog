import { BirdIcon } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <BirdIcon className="h-16 w-16 opacity-30" />
      <div className="max-w-56">
        <h2 className="text-lg font-semibold">Här var det tomt!</h2>
        <p className="mt-1 text-sm">
          Börja logga fåglar genom att trycka på{" "}
          <span className="font-semibold">+ Ny</span> i bottenmenyn.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
