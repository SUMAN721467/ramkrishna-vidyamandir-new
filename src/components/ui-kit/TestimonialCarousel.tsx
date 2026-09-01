import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { Testimonial } from "@/types";
import { cn } from "@/lib/utils";

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % testimonials.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [paused, testimonials.length]);

  const active = testimonials[index];
  if (!active) return null;


  return (
    <div
      className="mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Parent and alumni testimonials"
    >
      <div className="relative rounded-3xl border border-border/70 bg-card p-8 shadow-soft sm:p-10">
        <Quote aria-hidden="true" className="size-9 text-secondary" />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="mt-4"
          >
            <p className="text-lg leading-relaxed text-balance text-foreground">
              {active.message}
            </p>
            <footer className="mt-6 flex items-center gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {active.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {active.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{active.role}</span>
              </span>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => setIndex((c) => (c - 1 + testimonials.length) % testimonials.length)}
          className="inline-flex size-11 items-center justify-center rounded-full border border-primary/20 bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show testimonial ${dotIndex + 1}`}
              aria-current={dotIndex === index}
              onClick={() => setIndex(dotIndex)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                dotIndex === index ? "w-7 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => setIndex((c) => (c + 1) % testimonials.length)}
          className="inline-flex size-11 items-center justify-center rounded-full border border-primary/20 bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
