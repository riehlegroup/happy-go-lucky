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
import MessageBanner from "@/components/common/MessageBanner";
import AuthStorage from "@/services/storage/auth";
import usersApi from "@/services/api/users";

const Settings: React.FC = () => {

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [githubMessage, setGithubMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
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
      setEmailMessage({ text: "User data not available. Please log in again.", type: "error" });
      return;
    }

    try {
      const data = await usersApi.changeEmail({
        oldEmail: user.email,
        newEmail: newEmail,
      });

      const responseMessage = data.message || "Email changed successfully!";
      setEmailMessage({ text: responseMessage, type: "success" });
      if (responseMessage.toLowerCase().includes("successfully")) {
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        AuthStorage.getInstance().setEmail(newEmail);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setEmailMessage({ text: error.message, type: "error" });
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!user) {
      setPasswordMessage({ text: "User data not available. Please log in again.", type: "error" });
      return;
    }

    try {
      const data = await usersApi.changePassword({
        userEmail: user.email,
        password: newPassword,
      });

      const responseMessage = data.message || "Password changed successfully!";
      setPasswordMessage({ text: responseMessage, type: "success" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setPasswordMessage({ text: error.message, type: "error" });
      }
    }
  };

  const handleAddGithubUsername = async () => {
    if (!githubUsername) {
      setGithubMessage({ text: "GitHub username cannot be empty", type: "error" });
      return;
    }

    if (!user?.email) {
      setGithubMessage({ text: "User email not available", type: "error" });
      return;
    }

    try {
      const data = await usersApi.updateGithubUsername({
        userEmail: user.email,
        newGithubUsername: githubUsername,
      });

      const responseMessage = data.message || "GitHub username added successfully!";
      setGithubMessage({ text: responseMessage, type: "success" });
      if (responseMessage.toLowerCase().includes("successfully")) {
        const updatedUser = { ...user, UserGithubUsername: githubUsername } as typeof user;
        setUser(updatedUser);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setGithubMessage({ text: error.message, type: "error" });
      }
    }
  };

  return (
    <div className="min-h-screen">
      <TopNavBar title="Settings" showBackButton={true} showUserInfo={true} />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title="Account Settings">
          <div className="space-y-4">
            {/* Email Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Email Address</p>
                  <p className="font-medium">{user?.email || "Not available"}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Email Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="email"
                        label="New Email"
                        placeholder="Enter your new email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      {emailMessage && <MessageBanner message={emailMessage} />}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleEmailChange}>Change Email</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Password Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Password</p>
                  <p className="font-medium">••••••••</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        label="New Password"
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      {passwordMessage && <MessageBanner message={passwordMessage} />}
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePasswordChange}>Change Password</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* GitHub Username Setting */}
            <Card>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">GitHub Username</p>
                  <p className="font-medium">{user?.UserGithubUsername || "Not set"}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-fit text-sm">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit GitHub Username</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        label="GitHub Username"
                        placeholder="Enter your GitHub username"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                      />
                      {githubMessage && <MessageBanner message={githubMessage} />}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddGithubUsername}>Confirm</Button>
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