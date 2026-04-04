import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Activity, Role } from "./backend";
import AdminPanel from "./components/AdminPanel";
import CalendarView from "./components/CalendarView";
import GpxPanel from "./components/GpxPanel";
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
  const [gpxOpen, setGpxOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  // userColors as React state so components re-render when colors load
  const [userColors, setUserColors] = useState<Record<string, string>>({});

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
        const dayActivities = await actor.getActivitiesFiltered(
          dateKey,
          currentUserRef.current?.username ?? "",
        );
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

  // loadAll: updateSnapshot=true updates the badge snapshot (called on explicit refresh)
  // updateSnapshot=false is for background polling (badge accumulates)
  const loadAll = useCallback(
    async ({ updateSnapshot = false, silent = false } = {}) => {
      if (!actor) return;
      const hasCached = Object.keys(getCachedActivities()).length > 0;
      if (!silent) {
        if (hasCached) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }
      try {
        const today = formatLocalDate(new Date());
        const dks = getNext14DateKeys();
        const [, ...results] = await Promise.all([
          actor.purgeOldActivities(today),
          ...dks.map((dk) =>
            actor.getActivitiesFiltered(
              dk,
              currentUserRef.current?.username ?? "",
            ),
          ),
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

        // Badge logic
        const myUsername = currentUserRef.current?.username;
        const currentOtherCount = countOtherUsersActivities(map, myUsername);

        if (updateSnapshot) {
          // User explicitly refreshed -- clear badge and update snapshot
          setBadgeCount(0);
          setBadgeSnapshot(currentOtherCount);
          if ("clearAppBadge" in navigator) {
            (navigator as NavType).clearAppBadge?.().catch(() => {});
          }
        } else {
          // Background poll or initial load -- show new activity count
          const lastSeenCount = getBadgeSnapshot();
          const newCount = Math.max(0, currentOtherCount - lastSeenCount);
          setBadgeCount(newCount);
          if ("setAppBadge" in navigator && newCount > 0) {
            (navigator as NavType).setAppBadge?.(newCount).catch(() => {});
          }
        }
      } catch {
        if (!silent) toast.error("Błąd ładowania danych");
      } finally {
        if (!silent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [actor],
  );

  // Initial load
  useEffect(() => {
    if (actor && !isFetching) {
      loadAll();
    }
  }, [actor, isFetching, loadAll]);

  // Auto-refresh polling every 60 seconds (silent, badge accumulates)
  useEffect(() => {
    if (!actor || isFetching) return;
    const interval = setInterval(() => {
      loadAll({ silent: true });
    }, 60000);
    return () => clearInterval(interval);
  }, [actor, isFetching, loadAll]);

  // Load user colors from backend into React state (triggers re-render on components)
  const loadUserColors = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const rawUsers = await actor.getUsers();
      const users = rawUsers as unknown as Array<[string, string, string]>;
      const colors: Record<string, string> = {};
      for (const [name, , color] of users) {
        if (color) colors[name] = color;
      }
      setUserColors(colors);
    } catch {
      /* ignore */
    }
  }, [actor, isFetching]);

  useEffect(() => {
    loadUserColors();
  }, [loadUserColors]);

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
    // Clear badge on login
    setBadgeCount(0);
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

  const handleRefresh = useCallback(() => {
    loadAll({ updateSnapshot: true });
  }, [loadAll]);

  // Reload colors when admin panel closes (user may have been added/modified)
  const handleAdminClose = useCallback(() => {
    setAdminOpen(false);
    loadUserColors();
  }, [loadUserColors]);

  return (
    <div
      className="min-h-screen font-body relative"
      style={{
        backgroundImage: `url('/assets/generated/forest-wallpaper.dim_1080x1920.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay so text stays readable */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "rgba(5, 10, 20, 0.72)", zIndex: 0 }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        <Header
          currentUser={currentUser}
          onLoginClick={() => setLoginOpen(true)}
          onLogout={handleLogout}
          onAdminClick={() => setAdminOpen(true)}
          onGpxClick={() => setGpxOpen(true)}
          isRefreshing={refreshing}
          badgeCount={badgeCount}
          onRefresh={handleRefresh}
        />
        <main className="max-w-lg mx-auto px-2 pb-10 pt-1">
          <CalendarView
            dateKeys={dateKeys}
            activities={activities}
            loading={loading}
            currentUser={currentUser}
            actor={actor}
            userColors={userColors}
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
      </div>
      <LoginSheet
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        actor={actor}
        onLogin={handleLogin}
      />
      <AdminPanel open={adminOpen} onClose={handleAdminClose} actor={actor} />
      <GpxPanel
        open={gpxOpen}
        onClose={() => setGpxOpen(false)}
        actor={actor}
        currentUser={currentUser}
      />
      <Toaster position="top-center" richColors />
      {/* PWA icons - required for manifest, do not remove */}
      <img
        src="/assets/generated/rowerek-icon-192-round.dim_192x192.png"
        style={{ display: "none" }}
        aria-hidden="true"
        alt=""
      />
      <img
        src="/assets/generated/rowerek-icon-512-round.dim_512x512.png"
        style={{ display: "none" }}
        aria-hidden="true"
        alt=""
      />
    </div>
  );
}

export default App;
