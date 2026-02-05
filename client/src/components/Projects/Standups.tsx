import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopNavBar from "../common/TopNavBar";
import Button from "@/components/common/Button";
import Textarea from "@/components/common/Textarea";
import SectionCard from "@/components/common/SectionCard";
import MessageBanner from "@/components/common/MessageBanner";
import AuthStorage from "@/services/storage/auth";
import projectsApi from "@/services/api/projects";

const Standups: React.FC = () => {
  const location = useLocation();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const projectNameFromState = location.state?.projectName;
    if (projectNameFromState) {
      setProjectName(projectNameFromState);
    }
    const authStorage = AuthStorage.getInstance();
    const storedUserName = authStorage.getUserName();
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, [location.state]);

  const [doneText, setDoneText] = useState("");
  const [plansText, setPlansText] = useState("");
  const [challengesText, setChallengesText] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSendStandups = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!projectName || !userName) {
      setMessage({ text: "Missing project or user information", type: "error" });
      return;
    }

    try {
      await projectsApi.sendStandupEmail({
        projectName,
        userName,
        doneText,
        plansText,
        challengesText,
      });

      setMessage({ text: "Standup email sent successfully", type: "success" });
      setDoneText("");
      setPlansText("");
      setChallengesText("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unexpected error occurred", type: "error" });
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setState(e.target.value);
  };

  return (
    <div className="min-h-screen">
      <TopNavBar title="Standup Emails" showBackButton={true} showUserInfo={true} />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title="Submit Standup">
          <form onSubmit={handleSendStandups} className="space-y-6">
            <Textarea
              label="What did you complete yesterday?"
              placeholder="Enter completed work..."
              value={doneText}
              onChange={(e) => handleInputChange(e, setDoneText)}
              rows={5}
              required
            />

            <Textarea
              label="What are your plans for today?"
              placeholder="Enter your plans..."
              value={plansText}
              onChange={(e) => handleInputChange(e, setPlansText)}
              rows={5}
              required
            />

            <Textarea
              label="What blockers or challenges do you face?"
              placeholder="Enter any challenges..."
              value={challengesText}
              onChange={(e) => handleInputChange(e, setChallengesText)}
              rows={5}
              required
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="min-w-32">
                Send Email
              </Button>
            </div>

            {message && <MessageBanner message={message} />}
          </form>
        </SectionCard>
      </div>
    </div>
  );
};

export default Standups;
