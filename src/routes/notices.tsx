import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import classroom from "@/assets/classroom.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { NoticeCard } from "@/components/ui-kit/NoticeCard";
import { StaggerGroup, StaggerItem } from "@/components/ui-kit/Reveal";
import { notices } from "@/data/notices";
import { cn } from "@/lib/utils";

const title = "Notice Board — Ramkrishna Vidyamandir";
const description =
  "Latest circulars, examination routines, event announcements and holiday notices from Ramkrishna Vidyamandir, Barasat.";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/notices" },
    ],
    links: [{ rel: "canonical", href: "/notices" }],
  }),
  component: NoticesPage,
});

const categories = ["All", "Admission", "Examination", "Event", "Holiday", "General"] as const;

function NoticesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return notices.filter((notice) => {
      const matchesCategory = category === "All" || notice.category === category;
      const matchesText =
        text.length === 0 ||
        notice.title.toLowerCase().includes(text) ||
        notice.description.toLowerCase().includes(text);
      return matchesCategory && matchesText;
    });
  }, [query, category]);

  return (
    <>
      <PageHero
        eyebrow="Notices"
        title="School notice board"
        description="Every circular issued by the school office, newest first."
        image={classroom}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Announcements" title="Find a notice" />

        <div className="mt-10 space-y-4">
          <div className="relative mx-auto max-w-xl">
            <label htmlFor="notice-search" className="sr-only">
              Search notices
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="notice-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or keyword"
              className="w-full rounded-full border border-border bg-card py-3 pr-4 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div
            role="group"
            aria-label="Filter notices by category"
            className="no-scrollbar flex justify-start gap-2 overflow-x-auto pb-2 sm:justify-center"
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                  category === item
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "border border-border bg-card text-foreground hover:border-primary/30 hover:text-primary",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <StaggerGroup className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((notice) => (
              <StaggerItem key={notice.id}>
                <NoticeCard
                  notice={notice}
                  onDownload={(item) =>
                    toast.info("Download unavailable", {
                      description: `The PDF for "${item.title}" will be published shortly.`,
                    })
                  }
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No notices match your search.
          </p>
        )}
      </section>
    </>
  );
}
