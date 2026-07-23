import React, { useEffect } from "react";
import TopNavBar from "../common/TopNavBar";
import SectionCard from "../common/SectionCard";
import SubmissionLinkUploader from "./SubmissionLinkUploader";
import FileDownloader from "./FileDownloader";
import {useState} from "react";
import {
  fetchCompetitionDetails,
} from "../../services/api/competition";

const Competition: React.FC = () => {
  const [challengeTitle, setChallengeTitle] = useState("Title of Competition");
  const [challengeDescription, setChallengeDescription] = useState("Description of the competition goes here.");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompetitionData() {
      try {
        const response =  await fetchCompetitionDetails();
        setChallengeTitle(response.title);
        setChallengeDescription(response.description);
      } catch (error) {
        setError("Failed to fetch competition data");
      } finally {
        setIsLoading(false);
      }
    }

    //fetchCompetitionData(); TODO implement fetching competition data from backend when the endpoint is ready
  }, []);

  const submissionGuidelines = (<p>Specific instructions for the submission system goes here.</p>)


  return (
    <div className="min-h-screen">
      <TopNavBar
        title="Competition"
        showBackButton={true}
        showUserInfo={true}
      />
      
      <div className="mx-auto max-w-6xl space-y-4 p-4">
        <SectionCard title={challengeTitle}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Description</h3>
            <FileDownloader />
          </div>
          <div className="text-left">

            {challengeDescription}
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
