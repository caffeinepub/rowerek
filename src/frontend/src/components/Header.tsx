import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, Settings, User } from "lucide-react";
import { useEffect } from "react";
import type { UserSession } from "../App";
import { Role } from "../backend";

interface HeaderProps {
  currentUser: UserSession | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  isRefreshing?: boolean;
}

export default function Header({
  currentUser,
  onLoginClick,
  onLogout,
  onAdminClick,
  isRefreshing,
}: HeaderProps) {
  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("rowerek_theme", "dark");
  }, []);

  return (
    <header
      className="sticky top-0 z-40 bg-background/98 backdrop-blur border-b border-border shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-lg mx-auto px-3 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex items-center justify-center w-7 h-7">
            {isRefreshing ? (
              <svg
                className="animate-spin w-6 h-6 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Odświeżanie"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <span className="text-xl">🚴</span>
            )}
          </span>
          <span className="text-lg font-display font-bold text-foreground tracking-tight">
            Rowerek
          </span>
        </div>
        <div className="flex items-center gap-1">
          {currentUser?.role === Role.admin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground hover:text-foreground"
              onClick={onAdminClick}
              data-ocid="header.admin_button"
              aria-label="Panel administratora"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 gap-1.5 text-xs px-2.5"
                  data-ocid="header.login_button"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[80px] truncate">
                    {currentUser.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 text-xs px-2.5"
              onClick={onLoginClick}
              data-ocid="header.login_button"
            >
              <LogIn className="h-3.5 w-3.5" />
              Logowanie
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
