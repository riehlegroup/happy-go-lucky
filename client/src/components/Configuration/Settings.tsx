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

const Settings: React.FC = () => {

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [githubMessage, setGitHubMessage] = useState("");
  const [githubUsername, setGitHubUsername] = useState("");

  const [user, setUser] = useState<{
    name: string;
    email: string;
    githubUsername: string;
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
          githubUsername: "",
        });

        try {
          const githubUser = await usersApi.getGitHubUsername(userEmail);
          setGitHubUsername(githubUser);
          setUser((prev) => (prev ? { ...prev, githubUsername: githubUser } : null));
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
      setEmailMessage("User data not available. Please log in again.");
      return;
    }

    try {
      const data = await usersApi.changeEmail({
        oldEmail: user.email,
        newEmail: newEmail,
      });

      setEmailMessage(data.message || "Email changed successfully!");
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
      setPasswordMessage("User data not available. Please log in again.");
      return;
    }

    try {
      const data = await usersApi.changePassword({
        userEmail: user.email,
        password: newPassword,
      });

      setPasswordMessage(data.message || "Password changed successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setPasswordMessage(error.message);
      }
    }
  };

  const handleAddGitHubUsername = async () => {
    if (!githubUsername) {
    setGitHubMessage("GitHub username cannot be empty");
      return;
    }

    if (!user?.email) {
    setGitHubMessage("User email not available");
      return;
    }

    try {
      const data = await usersApi.updateGitHubUsername({
        userEmail: user.email,
        newGitHubUsername: githubUsername,
      });

  setGitHubMessage(data.message || "GitHub username added successfully!");
      if (data.message.includes("successfully")) {
        const updatedUser = { ...user, githubUsername: githubUsername };
        setUser(updatedUser);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setGitHubMessage(error.message);
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
                      {emailMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                          {emailMessage}
                        </div>
                      )}
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
                      {passwordMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                          {passwordMessage}
                        </div>
                      )}
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
                  <p className="font-medium">{user?.githubUsername || "Not set"}</p>
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
                        onChange={(e) => setGitHubUsername(e.target.value)}
                      />
                      {githubMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                          {githubMessage}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddGitHubUsername}>Confirm</Button>
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