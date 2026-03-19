import { Spinner } from "./ui/spinner";

const LoadingScreen = () => {
  return (
    <div className="flex h-dvh items-center justify-center">
      <Spinner className="size-12 text-neutral-500" />
    </div>
  );
};

export default LoadingScreen;
