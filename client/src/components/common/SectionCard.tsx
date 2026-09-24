import React from "react";
import SectionHeader from "./SectionHeader";
import Card from "./Card";

interface SectionCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <div className="space-y-3">
      <SectionHeader title={title} />
      <Card>{children}</Card>
    </div>
  );
};

export default SectionCard;
