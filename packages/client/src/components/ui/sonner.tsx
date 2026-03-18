import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast border shadow-lg !rounded-lg",
          success: "!bg-[oklch(0.92_0.04_145)] !text-[oklch(0.30_0.10_145)] !border-[oklch(0.82_0.06_145)]",
          error: "!bg-[oklch(0.92_0.04_25)] !text-[oklch(0.30_0.10_25)] !border-[oklch(0.82_0.06_25)]",
          warning: "!bg-[oklch(0.92_0.04_85)] !text-[oklch(0.30_0.10_85)] !border-[oklch(0.82_0.06_85)]",
          info: "!bg-[oklch(0.92_0.04_230)] !text-[oklch(0.30_0.10_230)] !border-[oklch(0.82_0.06_230)]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
