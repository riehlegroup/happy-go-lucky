import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = Required<Pick<ToastOptions, "variant" | "durationMs">> &
  Pick<ToastOptions, "title" | "description"> & {
    id: string;
    createdAt: number;
  };

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
  toasts: ToastItem[];
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timersRef = React.useRef<Map<string, number>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = randomId();
      const variant: ToastVariant = options.variant ?? "default";
      const durationMs = options.durationMs ?? 5000;

      const item: ToastItem = {
        id,
        createdAt: Date.now(),
        title: options.title,
        description: options.description,
        variant,
        durationMs,
      };

      setToasts((prev) => [item, ...prev].slice(0, 5));

      const timeoutId = window.setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timeoutId);
    },
    [dismiss]
  );

  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  const value = React.useMemo<ToastContextValue>(() => {
    return { toast, dismiss, toasts };
  }, [toast, dismiss, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): Pick<ToastContextValue, "toast" | "dismiss"> {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return { toast: ctx.toast, dismiss: ctx.dismiss };
}

export function Toaster() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:w-auto">
      {ctx.toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "relative overflow-hidden rounded-lg border p-4 shadow-lg",
            "bg-white text-slate-900",
            t.variant === "destructive" && "border-red-200 bg-red-50 text-red-950",
            t.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950"
          )}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={() => ctx.dismiss(t.id)}
            className={cn(
              "absolute right-2 top-2 rounded p-1",
              "border-0 bg-transparent",
              "opacity-70 transition-opacity hover:opacity-100",
              "hover:bg-slate-900/5 focus-visible:opacity-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              t.variant === "destructive" &&
                "text-red-900 hover:bg-red-900/10 focus-visible:ring-red-400/40",
              t.variant === "success" &&
                "text-emerald-900 hover:bg-emerald-900/10 focus-visible:ring-emerald-400/40"
            )}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>

          {t.title && <div className="mb-1 text-sm font-semibold">{t.title}</div>}
          {t.description && <div className="text-sm opacity-90">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
