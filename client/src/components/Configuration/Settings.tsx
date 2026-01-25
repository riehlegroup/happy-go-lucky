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

type MessageState = {
  text: string;
  type: "success" | "error";
};

const Message = ({ message }: { message: MessageState | null }) => {
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

const Row = ({
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
        <div className="text-sm text-left text-slate-600">{value}</div>
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
  const [emailMessage, setEmailMessage] = useState<MessageState | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<MessageState | null>(null);
  const [githubMessage, setGithubMessage] = useState<MessageState | null>(null);

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
      const data = await usersApi.changeEmail({
        oldEmail: user.email,
        newEmail: newEmail,
      });

      setEmailMessage({ text: data.message, type: "success" });
      setUser({ ...user, email: newEmail });
      AuthStorage.getInstance().setEmail(newEmail);
      // setEmailOpen(false);
    } catch (err: any) {
      setEmailMessage({ text: err.message, type: "error" });
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

      setPasswordMessage({ text: data.message, type: "success" });
      // setPasswordOpen(false);
    } catch (err: any) {
      setPasswordMessage({ text: err.message, type: "error" });
    }
  };

  const handleGithubChange = async () => {
    if (!githubUsername) {
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
      // setGithubOpen(false);
    } catch (err: any) {
      setGithubMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="min-h-screen">
      <TopNavBar title="Settings" showBackButton={true} showUserInfo={true} />

      <div className="mx-auto max-w-4xl p-4 pt-16 space-y-4">
        <SectionCard title="Account settings">
          <Card>
            <div className="divide-y divide-slate-200">
              {/* Email */}
              <Row
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
                    <Button type="button">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Email</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="email"
                      label="New email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <Message message={emailMessage} />
                    <DialogFooter>
                      <Button type="button" onClick={handleEmailChange}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Row>

              {/* Password */}
              <Row
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
                    <Button type="button">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="password"
                      label="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Message message={passwordMessage} />
                    <DialogFooter>
                      <Button type="button" onClick={handlePasswordChange}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Row>

              {/* GitHub */}
              <Row
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
                    <Button type="button">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>GitHub Username</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="text"
                      label="GitHub username"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                    />
                    <Message message={githubMessage} />
                    <DialogFooter>
                      <Button type="button" onClick={handleGithubChange}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Row>
            </div>
          </Card>
        </SectionCard>
      </div>
    </div>
  );
};

export default Settings;