import React from "react";
import { useNavigate } from "react-router-dom";
import AuthStorage from "@/services/storage/auth";
import { msgKey, translate } from "@/Resources/i18n";

interface TopNavBarProps {
  title: string;
  showBackButton?: boolean;
  showUserInfo?: boolean;
}

const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  showBackButton = false,
  showUserInfo = true,
}) => {
  const navigate = useNavigate();
  const authStorage = AuthStorage.getInstance();
  const username = authStorage.getUserName();

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login");
  };

  const handleBack = () => {
    // Try to go back in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, go to dashboard
      navigate("/dashboard");
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-primary px-6 py-1 shadow-sm">
      {/* Left section: Back button and title */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="rounded-md border-2 border-transparent bg-primary px-4 py-2 font-medium text-primary-foreground transition-all hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none active:outline-none"
          >
            {translate(msgKey.common.actions.back)}
          </button>
        )}
        <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
      </div>

      {/* Right section: Username and Logout button */}
      {showUserInfo && username && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-primary-foreground">
            {translate(msgKey.common.topNav.user, username)}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border-2 border-transparent bg-primary px-4 py-2 font-medium text-primary-foreground transition-all hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none active:outline-none"
          >
            {translate(msgKey.common.actions.logout)}
          </button>
        </div>
      )}
    </div>
  );
};

export default TopNavBar;
