import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Activity, Role } from "./backend";
import AdminPanel from "./components/AdminPanel";
import CalendarView from "./components/CalendarView";
import Header from "./components/Header";
import LoginSheet from "./components/LoginSheet";
import { useActor } from "./hooks/useActor";
import { formatLocalDate, getNext14DateKeys } from "./utils/helpers";

export interface UserSession {
  username: string;
  role: Role;
}

type NavType = Navigator & {
  setAppBadge?: (n?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

function getCachedActivities(): Record<string, Activity[]> {
  try {
    const cached = localStorage.getItem("rowerek_activities_cache");
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function getBadgeSnapshot(): number {
  try {
    return (
      Number.parseInt(
        localStorage.getItem("rowerek_badge_snapshot") ?? "0",
        10,
      ) || 0
    );
  } catch {
    return 0;
  }
}

function setBadgeSnapshot(count: number) {
  try {
    localStorage.setItem("rowerek_badge_snapshot", String(count));
  } catch {
    /* ignore */
  }
}

function countOtherUsersActivities(
  activitiesMap: Record<string, Activity[]>,
  myUsername?: string,
): number {
  return Object.values(activitiesMap).reduce((sum, dayActs) => {
    return sum + dayActs.filter((a) => a.username !== myUsername).length;
  }, 0);
}

function App() {
  const { actor, isFetching } = useActor();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activities, setActivities] =
    useState<Record<string, Activity[]>>(getCachedActivities);
  const cached = useMemo(() => {
    const c = getCachedActivities();
    return Object.keys(c).length > 0;
  }, []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Keep ref to current activities + user for event handlers
  const activitiesRef = useRef(activities);
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const dateKeys = useMemo(() => getNext14DateKeys(), []);

  useEffect(() => {
    const saved = localStorage.getItem("rowerek_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("rowerek_user");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("rowerek_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("rowerek_user");
    }
  }, [currentUser]);

  const loadDay = useCallback(
    async (dateKey: string) => {
      if (!actor) return;
      try {
        const dayActivities = await actor.getActivitiesForDay(dateKey);
        setActivities((prev) => {
          const updated = { ...prev, [dateKey]: dayActivities };
          try {
            localStorage.setItem(
              "rowerek_activities_cache",
              JSON.stringify(updated),
            );
          } catch {
            /* ignore */
          }
          return updated;
        });
      } catch {
        toast.error("Błąd odświeżania dnia");
      }
    },
    [actor],
  );

  const setDayActivities = useCallback((dk: string, acts: Activity[]) => {
    setActivities((prev) => {
      const updated = { ...prev, [dk]: acts };
      try {
        localStorage.setItem(
          "rowerek_activities_cache",
          JSON.stringify(updated),
        );
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  const loadAll = useCallback(async () => {
    if (!actor) return;
    const hasCached = Object.keys(getCachedActivities()).length > 0;
    if (hasCached) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const today = formatLocalDate(new Date());
      const dks = getNext14DateKeys();
      const [, ...results] = await Promise.all([
        actor.purgeOldActivities(today),
        ...dks.map((dk) => actor.getActivitiesForDay(dk)),
      ]);
      const map: Record<string, Activity[]> = {};
      dks.forEach((dk, i) => {
        map[dk] = results[i] as Activity[];
      });
      setActivities(map);
      try {
        localStorage.setItem("rowerek_activities_cache", JSON.stringify(map));
      } catch {
        /* ignore */
      }

      // App Badging: compare other-users' activity count to stored snapshot
      if ("setAppBadge" in navigator) {
        const myUsername = currentUserRef.current?.username;
        const currentCount = countOtherUsersActivities(map, myUsername);
        const snapshot = getBadgeSnapshot();
        if (currentCount > snapshot) {
          const newCount = currentCount - snapshot;
          (navigator as NavType).setAppBadge?.(newCount).catch(() => {});
        }
        // Always update snapshot to current count so next load compares correctly
        setBadgeSnapshot(currentCount);
      }
    } catch {
      toast.error("Błąd ładowania danych");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) {
      loadAll();
    }
  }, [actor, isFetching, loadAll]);

  // Clear badge when user focuses/visits the app
  useEffect(() => {
    const clearBadge = () => {
      if ("clearAppBadge" in navigator) {
        (navigator as NavType).clearAppBadge?.().catch(() => {});
      }
      // Update snapshot to current other-users count so no false badge on next load
      const myUsername = currentUserRef.current?.username;
      const currentCount = countOtherUsersActivities(
        activitiesRef.current,
        myUsername,
      );
      setBadgeSnapshot(currentCount);
    };

    const handleFocus = () => clearBadge();
    const handleVisibility = () => {
      if (!document.hidden) clearBadge();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Midnight page reload
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
    );
    const ms = midnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      try {
        localStorage.removeItem("rowerek_activities_cache");
      } catch {
        /* ignore */
      }
      window.location.reload();
    }, ms);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (username: string, role: Role) => {
    setCurrentUser({ username, role });
    setLoginOpen(false);
    toast.success(`Zalogowano jako ${username}`, { duration: 800 });
    // Clear badge on login — user is now looking at the app
    if ("clearAppBadge" in navigator) {
      (navigator as NavType).clearAppBadge?.().catch(() => {});
    }
    const currentCount = countOtherUsersActivities(
      activitiesRef.current,
      username,
    );
    setBadgeSnapshot(currentCount);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.success("Wylogowano", { duration: 1000 });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Header
        currentUser={currentUser}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
        onAdminClick={() => setAdminOpen(true)}
      />
      <main className="max-w-lg mx-auto px-2 pb-10 pt-1">
        {refreshing && (
          <div className="flex justify-center py-1">
            <span className="text-xs text-muted-foreground animate-pulse">
              odświeżanie...
            </span>
          </div>
        )}
        <CalendarView
          dateKeys={dateKeys}
          activities={activities}
          loading={loading}
          currentUser={currentUser}
          actor={actor}
          onDayRefresh={loadDay}
          onSetDayActivities={setDayActivities}
          onLoginRequired={() => setLoginOpen(true)}
        />
      </main>
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Zbudowane z ❤️ na caffeine.ai
        </a>
      </footer>
      <LoginSheet
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        actor={actor}
        onLogin={handleLogin}
      />
      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        actor={actor}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
