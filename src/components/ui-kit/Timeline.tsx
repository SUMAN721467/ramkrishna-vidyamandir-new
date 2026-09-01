import type { TimelineEvent } from "@/types";
import { Reveal } from "./Reveal";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative mx-auto max-w-3xl border-l-2 border-primary/15 pl-8">
      {events.map((event, index) => (
        <Reveal as="li" key={event.id} delay={index * 0.05} className="relative pb-10 last:pb-0">
          <span className="absolute top-1.5 -left-[41px] inline-flex size-5 items-center justify-center rounded-full border-4 border-background bg-secondary" />
          <span className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {event.year}
          </span>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{event.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
        </Reveal>
      ))}
    </ol>
  );
}
