import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserSession } from "../App";
import { Role } from "../backend";

interface HeaderProps {
  currentUser: UserSession | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  isRefreshing?: boolean;
  badgeCount?: number;
  onRefresh?: () => void;
}

export default function Header({
  currentUser,
  onLoginClick,
  onLogout,
  onAdminClick,
  isRefreshing,
  badgeCount = 0,
  onRefresh,
}: HeaderProps) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rowerek_theme");
    return saved === "dark";
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("rowerek_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("rowerek_theme", "light");
    }
  }, [dark]);

  // Apply saved theme on first render
  useEffect(() => {
    const saved = localStorage.getItem("rowerek_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <header
      className="sticky top-0 z-40 bg-background/98 backdrop-blur border-b border-border shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-lg mx-auto px-3 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="relative inline-flex items-center justify-center w-7 h-7 rounded focus:outline-none active:opacity-70"
            aria-label="Odśwież"
            data-ocid="header.refresh_button"
          >
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
            {badgeCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-[3px] leading-none pointer-events-none"
                data-ocid="header.badge"
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </button>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground hover:text-foreground"
            onClick={() => setDark((v) => !v)}
            aria-label={dark ? "Tryb jasny" : "Tryb ciemny"}
            data-ocid="header.toggle"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
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
