import React, { useState, useEffect } from "react";
import TopNavBar from "../common/TopNavBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import SectionCard from "@/components/common/SectionCard";
import AuthStorage from "@/services/storage/auth";
import usersApi from "@/services/api/users";
import { msgKey, translate } from "@/Resources/i18n";

const UserPanel: React.FC = () => {

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [githubMessage, setGithubMessage] = useState("");
  const [user, setUser] = useState<{
    name: string;
    email: string;
    UserGithubUsername: string;
  } | null>(null);

  const fetchUserData = async () => {
    const authStorage = AuthStorage.getInstance();
    const userName = authStorage.getUserName();
    const userEmail = authStorage.getEmail();

    if (userName && userEmail) {
      setUser({
        name: userName,
        email: userEmail,
        UserGithubUsername: "",
      });

      try {
        const githubUser = await usersApi.getGithubUsername(userEmail);
        setGithubUsername(githubUser);
        setUser((prev) => prev ? { ...prev, UserGithubUsername: githubUser } : null);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      console.warn("User data not found in storage");
    }
  };

  
  useEffect(() => {
    fetchUserData();
  }, []);


 
  const handleEmailChange = async () => {
    if (!user) {
      setEmailMessage(translate(msgKey.common.errors.userDataMissing));
      return;
    }

    try {
      const data = await usersApi.changeEmail({
        oldEmail: user.email,
        newEmail: newEmail,
      });

      setEmailMessage(
        data.message ||
          translate(msgKey.configuration.settings.messages.emailChangedFallback)
      );
      if (data.message.includes("successfully")) {
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        AuthStorage.getInstance().setEmail(newEmail);
        setNewEmail("");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setEmailMessage(error.message);
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!user) {
      setPasswordMessage(translate(msgKey.common.errors.userDataMissing));
      return;
    }

    try {
      const data = await usersApi.changePassword({
        userEmail: user.email,
        password: newPassword,
      });

      setPasswordMessage(
        data.message ||
          translate(msgKey.configuration.settings.messages.passwordChangedFallback)
      );
      if (data.message.includes("successfully")) {
        setNewPassword("");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setPasswordMessage(error.message);
      }
    }
  };

  const handleAddGithubUsername = async () => {
    if (!user?.email) {
      setGithubMessage(translate(msgKey.common.errors.userDataMissing));
      return;
    }

    if (!githubUsername || githubUsername.trim() === "") {
      setGithubMessage(
        translate(msgKey.configuration.settings.messages.githubUsernameEmpty)
      );
      return;
    }

    try {
      const data = await usersApi.updateGithubUsername({
        userEmail: user.email,
        newGithubUsername: githubUsername.trim(),
      });

      setGithubMessage(
        data.message ||
          translate(
            msgKey.configuration.settings.messages.githubUsernameUpdatedFallback
          )
      );
      if (data.message.includes("successfully")) {
        const updatedUser = { ...user, UserGithubUsername: githubUsername } as typeof user;
        setUser(updatedUser);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setGithubMessage(error.message);
      }
    }
  };

  const handleSubmitAll = async () => {
    if (newEmail) {
      await handleEmailChange();
    }
    if (newPassword) {
      await handlePasswordChange();
    }
    if (githubUsername) {
      await handleAddGithubUsername();
    }
  };

  return (
    <div className="min-h-screen">
      <TopNavBar
        title={translate(msgKey.configuration.userPanel.title)}
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title={translate(msgKey.configuration.userPanel.updateProfile)}>
          <div className="space-y-6">
            <Input
              type="email"
              label={translate(msgKey.configuration.settings.labels.emailAddress)}
              placeholder={user?.email || ""}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            {emailMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {emailMessage}
              </div>
            )}

            <Input
              type="password"
              label={translate(msgKey.configuration.userPanel.labels.newPassword)}
              placeholder={translate(
                msgKey.configuration.userPanel.placeholders.newPassword
              )}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {passwordMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {passwordMessage}
              </div>
            )}

            <Input
              type="text"
              label={translate(msgKey.configuration.userPanel.labels.githubUsername)}
              placeholder={translate(
                msgKey.configuration.userPanel.placeholders.githubUsername
              )}
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
            {githubMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {githubMessage}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSubmitAll}>
                {translate(msgKey.configuration.userPanel.submitChanges)}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setNewEmail("");
                  setNewPassword("");
                  setGithubUsername("");
                  setEmailMessage("");
                  setPasswordMessage("");
                  setGithubMessage("");
                }}
              >
                {translate(msgKey.common.actions.reset)}
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default UserPanel;
