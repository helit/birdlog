import { CameraIcon, PlusIcon, WandSparklesIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IdentifyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl bg-primary/10">
        <div className="flex h-[calc(100svh-15rem)] items-center justify-center">
          <p className="text-sm text-muted-foreground">Dagens fågel</p>
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <button
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/guided")}
        >
          <WandSparklesIcon className="size-6 text-primary" />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-primary shadow-sm active:scale-95"
          onClick={() => navigate("/new")}
        >
          <PlusIcon className="size-6 text-primary-foreground" />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/photo")}
        >
          <CameraIcon className="size-6 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default IdentifyPage;
