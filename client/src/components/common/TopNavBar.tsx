import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
import AuthStorage from "@/services/storage/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const handleUserProfile = () => {
    navigate("/user-panel");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-primary px-6 py-3 shadow-sm">
        {/* Left section: Back button and title */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="rounded-md border-2 border-transparent bg-primary px-4 py-2 font-medium text-primary-foreground transition-all hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none active:outline-none"
            >
              ← Back
            </button>
          )}
          <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
        </div>

        {/* Right section: User menu */}
        {showUserInfo && username && (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open user menu"
                  className="flex size-10 items-center justify-center rounded-full border-0 p-0 bg-white text-primary transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  <User className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {authStorage.getEmail()}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUserProfile} className="cursor-pointer">
                  <User className="mr-2 size-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                  <Settings className="mr-2 size-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-20" />
    </>
  );
};

export default TopNavBar;
