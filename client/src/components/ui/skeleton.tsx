import React from "react";

function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-300 dark:bg-slate-700 
        before:absolute before:inset-0 
        before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent 
        before:animate-[shimmer_1.5s_infinite] 
        dark:before:via-white/20 
        ${className}`}
      {...props}
    />
  );
}

export { Skeleton };