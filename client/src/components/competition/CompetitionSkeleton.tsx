import React from "react";
import TopNavBar from "../common/TopNavBar";
import SectionCard from "../common/SectionCard";
import { Skeleton } from "../ui/skeleton";


export const CompetitionSkeleton: React.FC = () => {
  return (
    <div 
      className="min-h-screen select-none" 
      role="status" 
      aria-busy="true"
    >
      <span className="sr-only">Wettbewerbsdaten werden geladen...</span>

      <TopNavBar
        title="Competition"
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="pointer-events-none mx-auto max-w-6xl space-y-4 p-4">
        {/* Card 1: details and download actions */}
        <div className="opacity-75">
          <SectionCard title={<Skeleton className="my-1 h-7 w-56" />}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-28" />
                {/* Represents the Download Training Dataset button */}
                <Skeleton className="h-10 w-48 rounded-md" />
            </div>

            {/* Description */}
            <div className="space-y-2.5 py-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Submission Guidelines */}
            <div className="my-4 pt-1">
              <Skeleton className="h-5 w-44" />
            </div>
          </SectionCard>
        </div>

        {/* Card 2: Link Submission */}
        <div className="opacity-75">
          <SectionCard title="Solution Submission">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pt-1">
              {/* Represents input field */}
              <Skeleton className="h-10 w-full rounded-md" />
              {/* Represents submit button */}
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default CompetitionSkeleton;