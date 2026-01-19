import { useState } from "react";

import TopNavBar from "../common/TopNavBar";
import Table from "../common/Table";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import Edit from "./../../assets/Edit.png";
import EmailIcon from "./../../assets/EmailIcon.png";

import { isValidEmail } from "@/utils/emailValidation";
import usersApi from "@/services/api/users";
import { en as messages } from "@/messages";

const userStatus = ["unconfirmed", "confirmed", "suspended", "removed"];

interface User {
  id: number;
  email: string;
  name: string;
  githubUsername: string | null;
  status: string;
  password: string;
  userRole: string;
}

interface UserEditProps {
  user: User;
  open: boolean;
  onClose: (update: boolean) => void;
}

function UserEdit({ user, open, onClose }: UserEditProps) {
  const [email, setEmail] = useState<string>(user.email);
  const [githubUsername, setGithubUsername] = useState<string>(
    user.githubUsername || "",
  );
  const [status, setStatus] = useState<string>(user.status);
  const [password, setPassword] = useState<string>("");
  const [userRole, setUserRole] = useState<string>(user.userRole);

  function onSave() {
    const promises = [];
    if (githubUsername && githubUsername !== user.githubUsername) {
      promises.push(
        usersApi
          .updateGithubUsername({
            userEmail: user.email,
            newGithubUsername: githubUsername,
          })
          .catch(console.error),
      );
    }
    if (status !== user.status) {
      promises.push(
        usersApi
          .updateUserStatusPost({ userEmail: user.email, status: status })
          .catch(console.error),
      );
    }
    if (password) {
      promises.push(
        usersApi
          .changePassword({ userEmail: user.email, password: password })
          .catch(console.error),
      );
    }
    if (userRole !== user.userRole) {
      promises.push(
        usersApi
          .updateUserRole({ email: user.email, role: userRole })
          .catch(console.error),
      );
    }

    Promise.all(promises)
      .then(() =>
        email !== user.email
          ? usersApi
              .changeEmail({ newEmail: email, oldEmail: user.email })
              .catch(console.error)
          : null,
      )
      .then(() => onClose(true));
  }

  function onCancel() {
    onClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.admin.userAdmin.editDialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            label={messages.admin.userAdmin.fields.username}
            value={user.name}
            disabled={true}
          />
          <Input
            type="email"
            label={messages.admin.userAdmin.fields.email}
            value={email}
            onChange={(e) => {
              const newEmail = e.target.value;
              if (isValidEmail(newEmail) || newEmail === "") {
                setEmail(newEmail);
              }
            }}
          />
          <Input
            type="text"
            label={messages.admin.userAdmin.fields.githubUsername}
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              {messages.admin.userAdmin.fields.status}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900"
            >
              {userStatus.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <Input
            type="text"
            label={messages.admin.userAdmin.fields.userRole}
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
          />
          <Input
            type="password"
            label={messages.admin.userAdmin.fields.newPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {messages.common.cancel}
          </Button>
          <Button onClick={onSave}>{messages.common.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const UserAdmin = () => {
  const [users, setUsers] = useState<Array<User>>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  function fetchUsers() {
    setLoading(true);
    usersApi
      .getAllUsers()
      .then((us: Array<User>) => setUsers(us))
      .then(() => setLoading(false))
      .catch(console.error);
  }

  function sendConfirmationEmail(user: User) {
    usersApi
      .sendConfirmationEmail({ userEmail: user.email })
      .catch(console.error);
  }

  const tableData = users.map((user) => [
    user.name,
    user.email,
    user.githubUsername
      ? user.githubUsername
      : messages.admin.userAdmin.table.notAvailable,
    user.status,
    user.userRole,
    <div key={user.id} className="flex gap-3">
      <img
        className="h-5 cursor-pointer"
        src={Edit}
        title={messages.admin.userAdmin.icons.editTitle}
        onClick={() => setEditing(user)}
      />
      {user.status === "unconfirmed" && (
        <img
          className="h-5 cursor-pointer"
          src={EmailIcon}
          title={messages.admin.userAdmin.icons.sendConfirmationEmailTitle}
          onClick={() => sendConfirmationEmail(user)}
        />
      )}
    </div>,
  ]);

  return (
    <div className="min-h-screen">
      <TopNavBar
        title={messages.admin.userAdmin.pageTitle}
        showBackButton={true}
        showUserInfo={true}
      />
      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <Table
          headings={[
            messages.admin.userAdmin.table.headings.username,
            messages.admin.userAdmin.table.headings.email,
            messages.admin.userAdmin.table.headings.githubUsername,
            messages.admin.userAdmin.table.headings.status,
            messages.admin.userAdmin.table.headings.userRole,
            messages.admin.userAdmin.table.headings.action,
          ]}
          loading={loading}
          loadData={fetchUsers}
          data={tableData}
          rowsPerPage={9}
          filterOptions={{ key: 3, options: userStatus }}
        />
      </div>
      {editing && (
        <UserEdit
          user={editing}
          open={true}
          onClose={(update) => {
            setEditing(null);
            if (update) fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UserAdmin;
