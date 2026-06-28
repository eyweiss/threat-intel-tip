import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/types";

const config: Record<Confidence, { label: string; classes: string }> = {
  confirmed: {
    label: "Confirmed",
    classes:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  suspected: {
    label: "Suspected",
    classes:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: Confidence;
  className?: string;
}) {
  const { label, classes } = config[confidence];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}
