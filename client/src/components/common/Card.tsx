import React from "react";

interface CardProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="rounded-md bg-card text-card-foreground p-6 shadow-md border border-border">
      {children}
    </div>
  );
};

export default Card;
