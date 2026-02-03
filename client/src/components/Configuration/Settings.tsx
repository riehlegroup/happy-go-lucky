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
import { msgKey, translate } from "@/Resources/i18n";

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
          setUser((prev) => prev ? { ...prev, UserGithubUsername: githubUser } : null);
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setPasswordMessage(error.message);
      }
    }
  };

  const handleAddGithubUsername = async () => {
    if (!githubUsername) {
      setGithubMessage(
        translate(msgKey.configuration.settings.messages.githubUsernameEmpty)
      );
      return;
    }

    if (!user?.email) {
      setGithubMessage(
        translate(msgKey.configuration.settings.messages.userEmailNotAvailable)
      );
      return;
    }

    try {
      const data = await usersApi.updateGithubUsername({
        userEmail: user.email,
        newGithubUsername: githubUsername,
      });

      setGithubMessage(
        data.message ||
          translate(
            msgKey.configuration.settings.messages.githubUsernameAddedFallback
          )
      );
      if (data.message.includes("successfully")) {
        const updatedUser = { ...user, UserGithubUsername: githubUsername } as typeof user;
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
        title={translate(msgKey.configuration.settings.title)}
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard
          title={translate(msgKey.configuration.settings.sections.accountSettings)}
        >
          <div className="space-y-4">
            {/* Email Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {translate(msgKey.configuration.settings.labels.emailAddress)}
                  </p>
                  <p className="font-medium">
                    {user?.email || translate(msgKey.common.placeholders.notAvailable)}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      {translate(msgKey.common.actions.edit)}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {translate(msgKey.configuration.settings.dialogs.changeEmail)}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="email"
                        label={translate(msgKey.configuration.settings.labels.newEmail)}
                        placeholder={translate(
                          msgKey.configuration.settings.placeholders.newEmail
                        )}
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
                        {translate(msgKey.configuration.settings.actions.changeEmail)}
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
                    {translate(msgKey.configuration.settings.labels.password)}
                  </p>
                  <p className="font-medium">••••••••</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      {translate(msgKey.common.actions.edit)}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {translate(
                          msgKey.configuration.settings.dialogs.changePassword
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        label={translate(
                          msgKey.configuration.settings.labels.newPassword
                        )}
                        placeholder={translate(
                          msgKey.configuration.settings.placeholders.newPassword
                        )}
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
                        {translate(
                          msgKey.configuration.settings.actions.changePassword
                        )}
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
                    {translate(msgKey.configuration.settings.labels.githubUsername)}
                  </p>
                  <p className="font-medium">
                    {user?.UserGithubUsername || translate(msgKey.common.placeholders.notSet)}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      {translate(msgKey.common.actions.edit)}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {translate(
                          msgKey.configuration.settings.dialogs.editGithubUsername
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        label={translate(
                          msgKey.configuration.settings.labels.githubUsername
                        )}
                        placeholder={translate(
                          msgKey.configuration.settings.placeholders.githubUsername
                        )}
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
                        {translate(msgKey.common.actions.confirm)}
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