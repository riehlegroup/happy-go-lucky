import React from "react";
import TopNavBar from "../common/TopNavBar";
import SectionCard from "../common/SectionCard";
import SubmissionLinkUploader from "./SubmissionLinkUploader";
import { useCompetition } from "@/hooks/useCompetition";
import { DatasetType } from "@/types/competition.models";
import Button from "../common/Button";

const Competition: React.FC = () => {
  const {
    competition, 
    isLoading,
    isActionLoading,
    error,
    downloadDataset,
  } = useCompetition(1); // TODO Replace 1 with the actual competition ID out of context


  const submissionGuidelines = (<p>Specific instructions for the submission system goes here.</p>)


  if (isLoading) {
    return <div>Loading...</div>; //TODO: Replace with a proper loading spinner or skeleton component
  }

  //Handle error state if no competition is found or if there was an error fetching the competition data
  if(!competition) {
    return <div>No competition found or an error occurred: {error}</div>;
  }

  return (
    <div className="min-h-screen">
      <TopNavBar
        title="Competition"
        showBackButton={true}
        showUserInfo={true}
      />
      
      <div className="mx-auto max-w-6xl space-y-4 p-4">
        <SectionCard title={competition.name}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Description</h3>
            <Button onClick={() => downloadDataset(DatasetType.TRAIN)} disabled={isActionLoading}>
              Download Training Dataset
            </Button>
          </div>
          <div className="text-left">
            {competition.description}
          </div>
         
          <details className="text-left my-4">
            <summary className="font-bold cursor-pointer hover:text-blue-600">
              Submission Guidelines
            </summary>
            <div className="mt-2">
              <p>
               {submissionGuidelines}
              </p>
            </div>
          </details>
        </SectionCard>
        <SectionCard title="Solution Submission">
          <div>
            <SubmissionLinkUploader />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Competition;
