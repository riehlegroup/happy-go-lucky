import React, { useEffect, useRef } from "react";

type ShutdownOverlayProps = {
  message?: string;
};

const ShutdownOverlay: React.FC<ShutdownOverlayProps> = ({
  message = "System is shutting down. Please wait…",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.focus();

    const blockKeys = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", blockKeys, true);
    return () => window.removeEventListener("keydown", blockKeys, true);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6"
    >
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 text-center shadow-xl">
        <h2 className="text-xl font-semibold">Shutdown initiated</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <p className="mt-4 text-sm">
          This page is now locked to prevent further changes.
        </p>
      </div>
    </div>
  );
};

export default ShutdownOverlay;
