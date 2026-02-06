import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/Dialog";
import TermMessage, { Message } from "./TermMessage";

interface TermDialogProps {
  title: string;
  trigger: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onClick?: () => void;
  message?: Message | undefined;
  children: React.ReactNode;
}

export const TermDialog: React.FC<TermDialogProps> = ({
  title,
  trigger,
  isOpen,
  onClose,
  message,
  children,
}) => {
  const handleOpenChange = (open: boolean) => {
    if (open) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          {message && <TermMessage message={message} />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
