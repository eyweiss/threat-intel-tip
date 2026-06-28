import { cn } from "@/lib/utils";
import type { EntityType } from "@/lib/types";

const config: Record<EntityType, { label: string; classes: string }> = {
  actor: {
    label: "Actor",
    classes: "bg-purple-100 text-purple-800 border-purple-200",
  },
  vulnerability: {
    label: "Vulnerability",
    classes: "bg-rose-100 text-rose-800 border-rose-200",
  },
  campaign: {
    label: "Campaign",
    classes: "bg-teal-100 text-teal-800 border-teal-200",
  },
  sector: {
    label: "Sector",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export function EntityBadge({
  type,
  className,
}: {
  type: EntityType;
  className?: string;
}) {
  const { label, classes } = config[type];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}

export function entityTypeColor(type: EntityType): string {
  return config[type].classes;
}
