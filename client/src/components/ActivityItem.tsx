import { CalendarClock, Megaphone, UserPlus, Wrench } from "lucide-react";
import type { ActivityFieldsFragment } from "../graphql/generated/graphql";
import { relativeTime } from "../lib/time";

const ICONS = { BOOKING: CalendarClock, ANNOUNCEMENT: Megaphone, EQUIPMENT: Wrench, MEMBERSHIP: UserPlus } as const;

interface ActivityItemProps {
  activity: ActivityFieldsFragment;
  onMarkRead: (id: string) => void;
  now: number;
}

export function ActivityItem({ activity, onMarkRead, now }: ActivityItemProps) {
  const Icon = ICONS[activity.kind];
  return (
    <li className={`activity${activity.isRead ? "" : " activity--unread"}`}>
      <Icon className="activity__icon" size={18} aria-hidden="true" />
      <div>
        <p className="activity__summary">
          {!activity.isRead && <span className="visually-hidden">Unread: </span>}
          {activity.summary}
        </p>
        <p className="activity__meta">
          {activity.actor.name} · <time dateTime={activity.createdAt}>{relativeTime(activity.createdAt, now)}</time>
        </p>
      </div>
      {!activity.isRead && (
        <button
          type="button"
          className="button button-ghost"
          onClick={() => onMarkRead(activity.id)}
          aria-label={`Mark read: ${activity.summary}`}
        >
          Mark read
        </button>
      )}
    </li>
  );
}
