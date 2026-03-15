import type { Activity } from "../backend";
import { getUsernameColor } from "../utils/helpers";

interface ActivityCardProps {
  activity: Activity;
  isMatching: boolean;
  isOwn: boolean;
  index: number;
  onClick: () => void;
}

function BatteryBars({ duration }: { duration: number }) {
  return (
    <div className="absolute right-[3px] top-[3px] bottom-[3px] flex flex-col justify-between w-[5px] gap-[2px]">
      {[0, 1, 2, 3].map((pos) => {
        const filled = duration > 0 && duration >= 4 - pos;
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
  const dur = Number(activity.durationHours);

  return (
    <button
      type="button"
      className={`relative w-full text-left cursor-pointer rounded-md border transition-all card-press select-none min-h-[60px] bg-primary/5 ${
        isMatching ? "glow-green" : "border-border hover:border-primary/40"
      }`}
      style={{ padding: "4px", paddingRight: "12px" }}
      onClick={onClick}
      data-ocid={`activity.card.item.${index}`}
    >
      {/* Top row: emoji + time */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-lg leading-none">{activity.emoji}</span>
        <span className="text-[11px] font-mono font-bold text-foreground leading-none">
          {activity.startTime}
        </span>
      </div>
      {/* Username */}
      <div
        className="text-[12px] font-semibold truncate leading-none"
        style={{ color }}
      >
        {activity.username}
      </div>
      <BatteryBars duration={dur} />
    </button>
  );
}
