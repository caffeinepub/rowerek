import { useRef, useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import { getDayNumber, getPolishDayName, isWeekend } from "../utils/helpers";
import ActivityCard from "./ActivityCard";
import ActivityDetailSheet from "./ActivityDetailSheet";
import AddActivitySheet from "./AddActivitySheet";

interface DayRowProps {
  dateKey: string;
  index: number;
  activities: Activity[];
  currentUser: UserSession | null;
  actor: backendInterface | null;
  onRefresh: () => Promise<void>;
  onSetDayActivities: (dateKey: string, activities: Activity[]) => void;
  onLoginRequired: () => void;
}

export default function DayRow({
  dateKey,
  index,
  activities,
  currentUser,
  actor,
  onRefresh,
  onSetDayActivities,
  onLoginRequired,
}: DayRowProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  // Keep last activity in a ref so the sheet stays mounted during close animation
  const lastActivityRef = useRef<Activity | null>(null);
  if (selectedActivity !== null) {
    lastActivityRef.current = selectedActivity;
  }

  const dayName = getPolishDayName(dateKey);
  const dayNum = getDayNumber(dateKey);
  const weekend = isWeekend(dateKey);

  const matchKeys: Record<string, number> = {};
  for (const a of activities) {
    const k = `${a.emoji}|${a.startTime}`;
    matchKeys[k] = (matchKeys[k] ?? 0) + 1;
  }
  const isMatching = (a: Activity) =>
    (matchKeys[`${a.emoji}|${a.startTime}`] ?? 0) > 1;

  const handleAddClick = () => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    const userCount = activities.filter(
      (a) => a.username === currentUser.username,
    ).length;
    if (userCount >= 3) {
      toast.error("Osiągnąłeś limit 3 aktywności na ten dzień");
      return;
    }
    setAddOpen(true);
  };

  const handleCardClick = (activity: Activity) => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  // Don't clear selectedActivity immediately - let the animation finish.
  // The ref keeps the last activity alive for the sheet during animation.
  const handleDetailClose = (afterClose?: () => void) => {
    afterClose?.();
    setDetailOpen(false);
    // Delay clearing selectedActivity so sheet can animate out without unmounting
    setTimeout(() => {
      setSelectedActivity(null);
    }, 400);
  };

  return (
    <div
      className="rounded-lg border border-border overflow-hidden bg-card"
      data-ocid={`calendar.day.item.${index}`}
    >
      <div className="flex items-stretch min-h-[64px]">
        {/* Day label - LEFT side, clickable */}
        <button
          type="button"
          onClick={handleAddClick}
          className={`flex flex-col items-center justify-center w-12 shrink-0 border-r border-border py-1 px-1 hover:bg-muted active:bg-muted/80 transition-colors ${
            weekend ? "day-weekend-label" : "bg-muted/60"
          }`}
          aria-label="Dodaj aktywność"
          data-ocid={`calendar.day.label.${index}`}
        >
          <span
            className={`text-[13px] font-bold leading-tight uppercase tracking-wide ${
              weekend ? "text-sky-400" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {dayName}
          </span>
          <span
            className={`text-xl font-extrabold leading-tight ${
              weekend ? "text-sky-400" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {dayNum}
          </span>
        </button>

        {/* Activities area - clicking empty space opens add panel */}
        <div
          className="flex-1 p-1.5 pl-1 bg-card cursor-pointer"
          onClick={handleAddClick}
          // biome-ignore lint/a11y/useSemanticElements: cannot use button here due to nested button children
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleAddClick()}
          aria-label="Dodaj aktywność"
          data-ocid="calendar.day.empty_state"
        >
          {activities.length === 0 ? (
            <div className="h-full min-h-[48px] w-full rounded-md hover:bg-muted/40 active:bg-muted/60 transition-colors" />
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {activities.map((a, ci) => (
                <ActivityCard
                  key={String(a.id)}
                  activity={a}
                  isMatching={isMatching(a)}
                  isOwn={currentUser?.username === a.username}
                  index={ci + 1}
                  onClick={() => handleCardClick(a)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Always render when user is logged in - open prop controls animation, not mounting */}
      {currentUser && (
        <AddActivitySheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          dateKey={dateKey}
          actor={actor}
          currentUser={currentUser}
          dayActivities={activities}
          onSuccess={(newActivity) => {
            setAddOpen(false);
            onSetDayActivities(dateKey, [...activities, newActivity]);
            onRefresh().catch(() => {});
          }}
        />
      )}

      {/* Use lastActivityRef.current so component stays mounted during close animation */}
      {currentUser && lastActivityRef.current && (
        <ActivityDetailSheet
          open={detailOpen}
          activity={lastActivityRef.current}
          isOwn={currentUser.username === lastActivityRef.current.username}
          currentUser={currentUser}
          allDayActivities={activities}
          actor={actor}
          onClose={handleDetailClose}
          onSuccess={(updatedActivities) => {
            handleDetailClose(() => {
              onSetDayActivities(dateKey, updatedActivities);
              onRefresh().catch(() => {});
            });
          }}
        />
      )}
    </div>
  );
}
