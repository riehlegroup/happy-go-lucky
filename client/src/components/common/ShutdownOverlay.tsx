import React, { useEffect, useRef } from "react";
import Button from "@/components/common/Button";
import SystemStorage from "@/services/storage/system";

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
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 text-center text-gray-900 shadow-xl">
        <h2 className="text-xl font-semibold">Shutdown initiated</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <p className="mt-4 text-sm text-gray-700">
          This page is locked to prevent further changes.
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            variant="success"
            className="w-48"
            onClick={() => {
              SystemStorage.getInstance().setShutdownInProgress(false);
              window.location.reload();
            }}
          >
            Start system
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShutdownOverlay;
