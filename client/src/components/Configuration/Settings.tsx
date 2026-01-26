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
import { Mail, Lock, User, Pencil } from "lucide-react";
import { isValidEmail } from "@/utils/emailValidation";


type SettingsMessageState = {
  text: string;
  type: "success" | "error";
};

const SettingsMessage = ({ message }: { message: SettingsMessageState | null }) => {
  if (!message) return null;

  const styles =
    message.type === "success"
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700";

  return (
    <div className={`rounded-md p-3 text-sm ${styles}`}>
      {message.text}
    </div>
  );
};

const SettingsRow = ({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 py-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-sm text-slate-600">{value}</div>
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);


const Settings: React.FC = () => {
  /* form inputs */
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  /* messages */
  const [emailMessage, setEmailMessage] = useState<SettingsMessageState | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<SettingsMessageState | null>(null);
  const [githubMessage, setGithubMessage] = useState<SettingsMessageState | null>(null);

  /* dialog state */
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);

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
      if (!newEmail || !newEmail.trim()) {
        setEmailMessage({ text: "Email address cannot be empty.", type: "error" });
        return;
      }

      if(isValidEmail(newEmail) === false) {
        setEmailMessage({ text: "Invalid email address format.", type: "error" });
        return;
      }
      const data = await usersApi.changeEmail({
        oldEmail: user.email,
        newEmail: newEmail,
      });

      setEmailMessage({ text: data.message, type: "success" });
      setUser({ ...user, email: newEmail });
      AuthStorage.getInstance().setEmail(newEmail);
      setEmailOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setEmailMessage({ text: err.message, type: "error" });
        return;
      }
      setEmailMessage({ text: "An unknown error occurred.", type: "error" });
    }
  };

  const handlePasswordChange = async () => {
    if (!user) {
      setPasswordMessage({ text: "User data not available. Please log in again.", type: "error" });
      return;
    }

    if (!newPassword || newPassword.trim() === "") {
      setPasswordMessage({ text: "Password cannot be empty.", type: "error" });
      return;
    }

    try {
      const data = await usersApi.changePassword({
        userEmail: user.email,
        password: newPassword,
      });

      setPasswordMessage({ text: data.message, type: "success" });
      setPasswordOpen(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setPasswordMessage({ text: error.message, type: "error" });
        return;
      }
      setPasswordMessage({ text: "An error occurred.", type: "error" });
    }
  };

  const handleGithubChange = async () => {
    if (!githubUsername || githubUsername.trim() === "") {
      setGithubMessage({ text: "GitHub username cannot be empty.", type: "error" });
      return;
    }

    if (!user?.email) {
      setGithubMessage({ text: "User email not available.", type: "error" });
      return;
    }

    try {
      const data = await usersApi.updateGithubUsername({
        userEmail: user.email,
        newGithubUsername: githubUsername,
      });

      setGithubMessage({ text: data.message, type: "success" });
      setUser({ ...user, UserGithubUsername: githubUsername });
      setGithubOpen(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setGithubMessage({ text: error.message, type: "error" });
        return;
      }
      setGithubMessage({ text: "An error occurred.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen">
      <TopNavBar title="Settings" showBackButton={true} showUserInfo={true} />

      <div className="mx-auto max-w-4xl space-y-4 p-4 pt-16">
        <SectionCard title="Account Settings">
          <Card>
            <div className="divide-y divide-slate-200 text-left">
              {/* Email */}
              <SettingsRow
                icon={<Mail className="h-5 w-5" />}
                label="Email address"
                value={user?.email || "Not available"}
              >
                <Dialog
                  open={emailOpen}
                  onOpenChange={(open) => {
                    setEmailOpen(open);
                    if (open) {
                      setEmailMessage(null);
                      setNewEmail(user?.email || "");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button type="button" aria-label="Edit email address">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-medium leading-6 text-gray-900">Change Email Address</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="email"
                      label="New email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <SettingsMessage message={emailMessage} />
                    <DialogFooter>
                      <Button type="button" onClick={handleEmailChange}>
                        Change Email
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SettingsRow>

              {/* Password */}
              <SettingsRow
                icon={<Lock className="h-5 w-5" />}
                label="Password"
                value="••••••••"
              >
                <Dialog
                  open={passwordOpen}
                  onOpenChange={(open) => {
                    setPasswordOpen(open);
                    if (open) {
                      setPasswordMessage(null);
                      setNewPassword("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button type="button" aria-label="Edit password">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-medium leading-6 text-gray-900">Change Password</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="password"
                      label="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <SettingsMessage message={passwordMessage} />
                    <DialogFooter>
                      <Button type="button" aria-label="Change password" onClick={handlePasswordChange}>
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SettingsRow>

              {/* GitHub */}
              <SettingsRow
                icon={<User className="h-5 w-5" />}
                label="GitHub username"
                value={user?.UserGithubUsername || "Not set"}
              >
                <Dialog
                  open={githubOpen}
                  onOpenChange={(open) => {
                    setGithubOpen(open);
                    if (open) {
                      setGithubMessage(null);
                      setGithubUsername(user?.UserGithubUsername || "");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button type="button" aria-label="Edit GitHub username">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-medium leading-6 text-gray-900">Change GitHub Username</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="text"
                      label="GitHub username"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                    />
                    <SettingsMessage message={githubMessage} />
                    <DialogFooter>
                      <Button type="button" aria-label="Change GitHub username" onClick={handleGithubChange}>
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SettingsRow>
            </div>
          </Card>
        </SectionCard>
      </div>
    </div>
  );
};

export default Settings;