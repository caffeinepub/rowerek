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
}

export default function Header({
  currentUser,
  onLoginClick,
  onLogout,
  onAdminClick,
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
    <header className="sticky top-0 z-40 bg-background/98 backdrop-blur border-b border-border shadow-sm">
      <div className="max-w-lg mx-auto px-3 h-12 flex items-center justify-between">
        <span className="text-lg font-display font-bold text-foreground tracking-tight">
          🚴 Rowerek
        </span>
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
