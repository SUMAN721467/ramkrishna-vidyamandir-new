import type { Statistic } from "@/types";
import { useCountUp } from "@/hooks/useCountUp";
import { Icon } from "./Icon";

export function StatCard({ stat }: { stat: Statistic }) {
  const { ref, value } = useCountUp(stat.value);

  return (
    <div className="glass-panel rounded-3xl p-6 text-center shadow-soft transition-transform duration-300 hover:-translate-y-1">
      <span className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-secondary/25 text-primary">
        <Icon name={stat.icon} />
      </span>
      <p className="text-3xl font-bold text-primary sm:text-4xl">
        <span ref={ref}>{value.toLocaleString("en-IN")}</span>
        {stat.suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
    </div>
  );
}
