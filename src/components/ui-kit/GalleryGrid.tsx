import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "@/types";
import { cn } from "@/lib/utils";

interface GalleryGridProps {
  items: GalleryItem[];
  masonry?: boolean;
}

const aspectClass: Record<GalleryItem["aspect"], string> = {
  tall: "aspect-[3/4]",
  wide: "aspect-[4/3]",
  square: "aspect-square",
};

export function GalleryGrid({ items, masonry = true }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (direction: 1 | -1) =>
      setActiveIndex((current) =>
        current === null ? current : (current + direction + items.length) % items.length,
      ),
    [items.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, step]);

  const active = activeIndex === null ? null : items[activeIndex];

  return (
    <>
      <ul
        className={cn(
          masonry
            ? "columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5"
            : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {items.map((item, index) => (
          <li key={item.id} className={masonry ? "break-inside-avoid" : undefined}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block w-full overflow-hidden rounded-3xl shadow-soft transition-shadow duration-300 hover:shadow-lift"
              aria-label={`Open image: ${item.title}`}
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                width={1280}
                height={960}
                className={cn(
                  "w-full object-cover transition-transform duration-700 group-hover:scale-110",
                  masonry ? aspectClass[item.aspect] : "aspect-[4/3]",
                )}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary-dark/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-95" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-left">
                <span className="block text-xs font-semibold tracking-[0.18em] text-secondary uppercase">
                  {item.category}
                </span>
                <span className="mt-1 block text-sm font-semibold text-primary-foreground">
                  {item.title}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          className="fixed inset-0 z-100 flex items-center justify-center bg-primary-dark/90 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <motion.figure
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative max-h-full w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={active.src}
              alt={active.title}
              className="max-h-[75dvh] w-full rounded-3xl object-contain"
            />
            <figcaption className="mt-4 text-center text-sm font-medium text-primary-foreground">
              {active.title} — {active.category}
            </figcaption>

            <button
              type="button"
              onClick={close}
              aria-label="Close image preview"
              className="absolute -top-3 -right-3 inline-flex size-11 items-center justify-center rounded-full bg-card text-primary shadow-lift"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 -left-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-primary shadow-lift sm:-left-14"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute top-1/2 -right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-primary shadow-lift sm:-right-14"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </motion.figure>
        </div>
      ) : null}
    </>
  );
}
