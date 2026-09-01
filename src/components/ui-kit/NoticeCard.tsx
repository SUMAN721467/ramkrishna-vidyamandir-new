import { CalendarDays, Download, FileText } from "lucide-react";
import type { Notice } from "@/types";
import { cn } from "@/lib/utils";
import { formatNoticeDate } from "@/lib/format";

interface NoticeCardProps {
  notice: Notice;
  compact?: boolean;
  onDownload?: (notice: Notice) => void;
}

export function NoticeCard({ notice, compact = false, onDownload }: NoticeCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {notice.category}
        </span>
        {notice.isNew ? (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            New
          </span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-4" />
          <time dateTime={notice.date}>{formatNoticeDate(notice.date)}</time>
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold text-balance text-foreground group-hover:text-primary">
        {notice.title}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-muted-foreground",
          compact && "line-clamp-2",
        )}
      >
        {notice.description}
      </p>

      <div className="mt-5 flex items-center gap-3 pt-1">
        {onDownload ? (
          <button
            type="button"
            onClick={() => onDownload(notice)}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Download aria-hidden="true" className="size-4" />
            Download PDF
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <FileText aria-hidden="true" className="size-4" />
            Office notice
          </span>
        )}
      </div>
    </article>
  );
}
