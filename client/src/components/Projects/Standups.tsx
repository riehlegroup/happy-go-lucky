import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopNavBar from "../common/TopNavBar";
import Button from "@/components/common/Button";
import Textarea from "@/components/common/Textarea";
import SectionCard from "@/components/common/SectionCard";
import AuthStorage from "@/services/storage/auth";
import projectsApi from "@/services/api/projects";
import { msgKey, translate } from "@/Resources/i18n";

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
  const [message, setMessage] = useState("");

  const handleSendStandups = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!projectName || !userName) {
      setMessage(translate(msgKey.projects.standups.messages.missingProjectOrUser));
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

      setMessage(translate(msgKey.projects.standups.messages.emailSent));
      setDoneText("");
      setPlansText("");
      setChallengesText("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(translate(msgKey.common.errors.unexpected));
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
      <TopNavBar
        title={translate(msgKey.projects.standups.title)}
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title={translate(msgKey.projects.standups.sectionTitle)}>
          <form onSubmit={handleSendStandups} className="space-y-6">
            <Textarea
              label={translate(msgKey.projects.standups.fields.done.label)}
              placeholder={translate(msgKey.projects.standups.fields.done.placeholder)}
              value={doneText}
              onChange={(e) => handleInputChange(e, setDoneText)}
              rows={5}
              required
            />

            <Textarea
              label={translate(msgKey.projects.standups.fields.plans.label)}
              placeholder={translate(msgKey.projects.standups.fields.plans.placeholder)}
              value={plansText}
              onChange={(e) => handleInputChange(e, setPlansText)}
              rows={5}
              required
            />

            <Textarea
              label={translate(msgKey.projects.standups.fields.challenges.label)}
              placeholder={translate(msgKey.projects.standups.fields.challenges.placeholder)}
              value={challengesText}
              onChange={(e) => handleInputChange(e, setChallengesText)}
              rows={5}
              required
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="min-w-32">
                {translate(msgKey.common.actions.sendEmail)}
              </Button>
            </div>

            {message && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}
          </form>
        </SectionCard>
      </div>
    </div>
  );
};

export default Standups;
