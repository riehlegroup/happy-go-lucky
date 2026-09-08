import React from "react";

interface SectionHeaderProps {
  title: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <h2 className="w-fit border-b-[3px] border-primary pb-2 text-2xl font-semibold text-slate-900">
      {title}
    </h2>
  );
};

export default SectionHeader;
