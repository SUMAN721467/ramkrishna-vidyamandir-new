import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import annualDay from "@/assets/annual-day.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { GalleryGrid } from "@/components/ui-kit/GalleryGrid";
import { CtaBanner } from "@/components/ui-kit/CtaBanner";
import { galleryCategories, galleryItems, type GalleryFilter } from "@/data/gallery";
import { cn } from "@/lib/utils";

const title = "Photo Gallery — Ramkrishna Vidyamandir";
const description =
  "Photographs of the campus, classrooms, sports meets, annual day and events at Ramkrishna Vidyamandir, a Bengali medium school in Barasat.";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [filter, setFilter] = useState<GalleryFilter>("All");
  const items =
    filter === "All" ? galleryItems : galleryItems.filter((item) => item.category === filter);

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="School life in pictures"
        description="A glimpse of the classrooms, celebrations and playing fields our students grow up in."
        image={annualDay}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Moments" title="Browse by category" />

        <div
          role="group"
          aria-label="Filter gallery by category"
          className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-2"
        >
          {galleryCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                filter === category
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "border border-border bg-card text-foreground hover:border-primary/30 hover:text-primary",
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {items.length > 0 ? (
            <GalleryGrid items={items} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No photographs in this category yet.
            </p>
          )}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
