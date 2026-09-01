import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

interface InfoCardProps {
  icon?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  tone?: "plain" | "highlight";
}

export function InfoCard({
  icon,
  title,
  description,
  children,
  className,
  tone = "plain",
}: InfoCardProps) {
  return (
    <article
      className={cn(
        "group h-full rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift",
        tone === "highlight" && "border-secondary/50 bg-secondary/10",
        className,
      )}
    >
      {icon ? (
        <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon name={icon} />
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </article>
  );
}
