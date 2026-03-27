import type { Activity } from "../backend";
import { getUsernameColor } from "../utils/helpers";

interface ActivityCardProps {
  activity: Activity;
  isMatching: boolean;
  isOwn: boolean;
  index: number;
  onClick: () => void;
}

// duration is stored in half-hours (1 = 30min, 2 = 1h, ..., 8 = 4h)
function BatteryBars({ durationHalfHours }: { durationHalfHours: number }) {
  const capped = Math.min(durationHalfHours, 8);
  return (
    <div className="absolute right-[3px] top-[3px] bottom-[3px] flex flex-col justify-between w-[5px] gap-[1px]">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((pos) => {
        const filled = capped > 0 && capped >= 8 - pos;
        return (
          <div
            key={pos}
            className={`flex-1 rounded-[1px] ${
              filled ? "bg-primary" : "border border-border bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function ActivityCard({
  activity,
  isMatching,
  index,
  onClick,
}: ActivityCardProps) {
  const color = getUsernameColor(activity.username);
  const durationHalfHours = Number(activity.durationHours);
  const displayName =
    activity.username.length > 11
      ? activity.username.slice(0, 11)
      : activity.username;

  return (
    <button
      type="button"
      className={`relative w-full text-left cursor-pointer rounded-md border transition-all card-press select-none bg-primary/15 dark:bg-slate-700/60 ${
        isMatching ? "glow-green" : "border-border hover:border-primary/40"
      }`}
      style={{ padding: "4px", paddingRight: "14px" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-ocid={`activity.card.item.${index}`}
    >
      {/* Top row: emoji + time */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-2xl leading-none">{activity.emoji}</span>
        <span
          className="text-[13px] font-mono font-bold leading-none"
          style={{ color: "#7dd3fc" }}
        >
          {activity.startTime}
        </span>
      </div>
      {/* Gap + Username centered */}
      <div
        className="text-[13px] font-semibold leading-none text-center truncate"
        style={{ color, marginTop: "4px" }}
      >
        {displayName}
      </div>
      <BatteryBars durationHalfHours={durationHalfHours} />
    </button>
  );
}
