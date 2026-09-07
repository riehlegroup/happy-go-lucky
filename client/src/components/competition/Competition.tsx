import React from "react";
import TopNavBar from "../common/TopNavBar";
import SectionCard from "../common/SectionCard";
import SubmissionLinkUploader from "./SubmissionLinkUploader";
import { useCompetition } from "@/hooks/useCompetition";
import { DatasetType } from "@/types/competition.models";
import Button from "../common/Button";
import { useActiveProject } from "@/context/ActiveProjectContext";

const Competition: React.FC = () => {

  const {activeProject} = useActiveProject();
  const {
    competition, 
    isLoading,
    isActionLoading,
    error,
    downloadDataset,
  } = useCompetition(activeProject?.courseId); 


  const submissionGuidelines = (<div><p>For each competition a Training and Validation dataset will be provided. The training dataset will be used to train your model, while the validation dataset will be used to evaluate its performance before u submit your solution for evaluation. Use it to get an idea of how well your model performs on unseen data.</p>
    <p>Submit your solution by providing a link to your implementation. Your implementation must strictly follow this format. ...</p> {//TODO: add format/ schema for submission 
    }
    <p>At the end of the competition the interface of your solution will be called with an unknown set of evaluation data. Your predicitions will be evaluated based on their performance on this data. After Evaluation, a leaderboards will be updated with the results.</p>
    </div>
  )


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
            <div className="flex gap-4">
              <Button onClick={() => downloadDataset(DatasetType.TRAIN)} disabled={isActionLoading}>
                Download Training Dataset
              </Button>
              <Button onClick={() => downloadDataset(DatasetType.VALIDATION)} disabled={isActionLoading}>
                Download Validation Dataset
              </Button>
            </div>
            
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
