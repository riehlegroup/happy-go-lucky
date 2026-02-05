import React from "react";
import clsx from "clsx";

interface MessageBannerProps {
  message: {
    text: string;
    type: "success" | "error";
  };
  className?: string;
}

const MessageBanner: React.FC<MessageBannerProps> = ({ message, className }) => {
  const baseStyles = "rounded-md p-3 text-sm";
  const typeStyles = message.type === "success" 
    ? "bg-green-100 text-green-700" 
    : "bg-red-100 text-red-700";

  return (
    <div data-testid="message-banner" className={clsx(baseStyles, typeStyles, className)}>
      {message.text}
    </div>
  );
};

export default MessageBanner;
