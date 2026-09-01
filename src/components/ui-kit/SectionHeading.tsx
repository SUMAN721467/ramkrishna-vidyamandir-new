import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase",
            tone === "dark"
              ? "bg-primary/8 text-primary"
              : "bg-primary-foreground/15 text-secondary",
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <Tag
        className={cn(
          "mt-4 text-3xl font-bold text-balance sm:text-4xl",
          tone === "dark" ? "text-foreground" : "text-primary-foreground",
        )}
      >
        {title}
      </Tag>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            tone === "dark" ? "text-muted-foreground" : "text-primary-foreground/80",
          )}
        >
          {description}
        </p>
      ) : null}
      <span
        className={cn(
          "mt-6 block h-1 w-16 rounded-full bg-secondary",
          align === "center" && "mx-auto",
        )}
      />
    </div>
  );
}
