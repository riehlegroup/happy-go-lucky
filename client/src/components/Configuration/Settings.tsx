import React, { useState, useEffect } from "react";
import TopNavBar from "../common/TopNavBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import SectionCard from "@/components/common/SectionCard";
import Card from "@/components/common/Card";
import AuthStorage from "@/services/storage/auth";
import usersApi from "@/services/api/users";
import { en as messages } from "@/messages";

const Settings: React.FC = () => {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [githubMessage, setGithubMessage] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  const [user, setUser] = useState<{
    name: string;
    email: string;
    UserGithubUsername: string;
  } | null>(null);

  useEffect(() => {
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
          setUser((prev) =>
            prev ? { ...prev, UserGithubUsername: githubUser } : null,
          );
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.warn("User data not found in storage");
      }
    };

    fetchUserData();
  }, []);

  const handleEmailChange = async () => {
    if (!user) {
      setEmailMessage(messages.settings.user.notAvailableWarning);
      return;
    }

    try {
      const data = await usersApi.changeEmail({
        oldEmail: user.email,
        newEmail: newEmail,
      });

      setEmailMessage(data.message || messages.settings.email.successFallback);
      if (data.message.includes("successfully")) {
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        AuthStorage.getInstance().setEmail(newEmail);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setEmailMessage(error.message);
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!user) {
      setPasswordMessage(messages.settings.user.notAvailableWarning);
      return;
    }

    try {
      const data = await usersApi.changePassword({
        userEmail: user.email,
        password: newPassword,
      });

      setPasswordMessage(
        data.message || messages.settings.password.successFallback,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setPasswordMessage(error.message);
      }
    }
  };

  const handleAddGithubUsername = async () => {
    if (!githubUsername) {
      setGithubMessage(messages.settings.github.emptyError);
      return;
    }

    if (!user?.email) {
      setGithubMessage(messages.settings.github.emailMissingError);
      return;
    }

    try {
      const data = await usersApi.updateGithubUsername({
        userEmail: user.email,
        newGithubUsername: githubUsername,
      });

      setGithubMessage(
        data.message || messages.settings.github.successFallback,
      );
      if (data.message.includes("successfully")) {
        const updatedUser = {
          ...user,
          UserGithubUsername: githubUsername,
        } as typeof user;
        setUser(updatedUser);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setGithubMessage(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <TopNavBar
        title={messages.settings.pageTitle}
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title={messages.settings.sectionTitle}>
          <div className="space-y-4">
            {/* Email Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {messages.settings.email.label}
                  </p>
                  <p className="font-medium">
                    {user?.email || messages.settings.email.notAvailableValue}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      {messages.settings.edit}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {messages.settings.email.dialogTitle}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="email"
                        label={messages.settings.email.inputLabel}
                        placeholder={messages.settings.email.inputPlaceholder}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      {emailMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                          {emailMessage}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleEmailChange}>
                        {messages.settings.email.action}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Password Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {messages.settings.password.label}
                  </p>
                  <p className="font-medium">••••••••</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      {messages.settings.edit}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {messages.settings.password.dialogTitle}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        label={messages.settings.password.inputLabel}
                        placeholder={
                          messages.settings.password.inputPlaceholder
                        }
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      {passwordMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                          {passwordMessage}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePasswordChange}>
                        {messages.settings.password.action}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* GitHub Username Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {messages.settings.github.label}
                  </p>
                  <p className="font-medium">
                    {user?.UserGithubUsername ||
                      messages.settings.github.notSetValue}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      {messages.settings.edit}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {messages.settings.github.dialogTitle}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        label={messages.settings.github.inputLabel}
                        placeholder={messages.settings.github.inputPlaceholder}
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                      />
                      {githubMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                          {githubMessage}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddGithubUsername}>
                        {messages.settings.github.confirm}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Settings;
