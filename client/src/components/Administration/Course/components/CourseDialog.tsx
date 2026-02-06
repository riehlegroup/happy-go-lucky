import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/Dialog";
import CourseMessage, { Message } from "./CourseMessage";

interface CourseDialogProps {
  title: string;
  trigger: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onClick?: () => void;
  message?: Message | undefined;
  children: React.ReactNode;
}

/**
 * Presentational Component that wraps form content, displays messages, and provides a trigger button.
 * Uses radix/ui's Dialog for accessibility.
 */
export const CourseDialog: React.FC<CourseDialogProps> = ({
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
          {message && <CourseMessage message={message} />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
