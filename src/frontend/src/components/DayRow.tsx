import { useRef, useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import { getDayNumber, getPolishDayName, isWeekend } from "../utils/helpers";
import ActivityCard from "./ActivityCard";
import ActivityDetailSheet from "./ActivityDetailSheet";
import ActivitySheet from "./ActivitySheet";

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
  // activitySheetActivity: null = new activity, Activity = edit own activity
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [activitySheetTarget, setActivitySheetTarget] =
    useState<Activity | null>(null);

  const [selectedOtherActivity, setSelectedOtherActivity] =
    useState<Activity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Keep ref for sheet animation
  const lastOtherActivityRef = useRef<Activity | null>(null);
  if (selectedOtherActivity !== null) {
    lastOtherActivityRef.current = selectedOtherActivity;
  }
  const lastSheetTargetRef = useRef<Activity | null>(null);
  if (activitySheetTarget !== null) {
    lastSheetTargetRef.current = activitySheetTarget;
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

  // Open unified sheet in "new activity" mode
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
    setActivitySheetTarget(null);
    setActivitySheetOpen(true);
  };

  const handleCardClick = (activity: Activity) => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    if (currentUser.username === activity.username) {
      // Own activity: open unified sheet in edit mode
      setActivitySheetTarget(activity);
      setActivitySheetOpen(true);
    } else {
      // Other user's activity: open detail/join sheet
      setSelectedOtherActivity(activity);
      setDetailOpen(true);
    }
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setTimeout(() => setSelectedOtherActivity(null), 400);
  };

  const handleActivitySheetClose = () => {
    setActivitySheetOpen(false);
    setTimeout(() => setActivitySheetTarget(null), 400);
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

        {/* Activities area */}
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

      {/* Unified activity sheet for own activities and new activities */}
      {currentUser && (
        <ActivitySheet
          open={activitySheetOpen}
          onClose={handleActivitySheetClose}
          dateKey={dateKey}
          activity={
            activitySheetOpen ? activitySheetTarget : lastSheetTargetRef.current
          }
          currentUser={currentUser}
          dayActivities={activities}
          actor={actor}
          onSuccess={(updated) => {
            handleActivitySheetClose();
            onSetDayActivities(dateKey, updated);
            onRefresh().catch(() => {});
          }}
        />
      )}

      {/* Other user's activity sheet */}
      {currentUser && lastOtherActivityRef.current && (
        <ActivityDetailSheet
          open={detailOpen}
          activity={lastOtherActivityRef.current}
          currentUser={currentUser}
          allDayActivities={activities}
          actor={actor}
          onClose={handleDetailClose}
          onSuccess={(updated) => {
            handleDetailClose();
            onSetDayActivities(dateKey, updated);
            onRefresh().catch(() => {});
          }}
        />
      )}
    </div>
  );
}
