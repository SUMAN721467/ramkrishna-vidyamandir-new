import { ArrowRight, PhoneCall } from "lucide-react";
import { SCHOOL } from "@/data/site";
import { ActionLink } from "./ActionButton";
import { Reveal } from "./Reveal";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center shadow-lift sm:px-12">
        <span
          aria-hidden="true"
          className="absolute -top-24 -right-16 size-64 rounded-full bg-secondary/25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-28 -left-20 size-72 rounded-full bg-primary-light/40 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex rounded-full bg-secondary px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-secondary-foreground uppercase">
            Admissions Open
          </span>
          <h2 className="mt-5 text-3xl font-bold text-balance text-primary-foreground sm:text-4xl">
            Give your child a strong Bengali medium foundation
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/80">
            Applications for the 2027–28 session are now being accepted for Play through Class IX.
            Visit the campus or speak with our admission desk today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ActionLink to="/admissions" variant="secondary" size="lg">
              Apply Now
              <ArrowRight aria-hidden="true" className="size-4" />
            </ActionLink>
            <a
              href={`tel:${SCHOOL.phone.replace(/\s/g, "")}`}
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-primary-foreground/30 px-7 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              <PhoneCall aria-hidden="true" className="size-4" />
              {SCHOOL.phone}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
