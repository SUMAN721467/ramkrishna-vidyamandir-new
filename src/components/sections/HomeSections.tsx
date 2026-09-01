import { ArrowRight } from "lucide-react";
import { academicLevels, achievements, testimonials, upcomingEvents } from "@/data/school";
import { notices } from "@/data/notices";
import { galleryItems } from "@/data/gallery";
import { SCHOOL } from "@/data/site";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui-kit/Reveal";
import { ActionLink } from "@/components/ui-kit/ActionButton";
import { Icon } from "@/components/ui-kit/Icon";
import { NoticeCard } from "@/components/ui-kit/NoticeCard";
import { GalleryGrid } from "@/components/ui-kit/GalleryGrid";
import { InfoCard } from "@/components/ui-kit/InfoCard";
import { TestimonialCarousel } from "@/components/ui-kit/TestimonialCarousel";

export function AcademicLevelsSection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Academics"
          title="From first rhymes to Madhyamik"
          description="A continuous, carefully sequenced journey through five academic stages."
        />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {academicLevels.map((level) => (
            <StaggerItem key={level.id}>
              <article className="group flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={level.icon} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{level.name}</h3>
                <p className="text-xs font-medium text-primary">{level.classes}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {level.description}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">{level.ageGroup}</p>
              </article>
            </StaggerItem>
          ))}
          <StaggerItem>
            <div className="flex h-full flex-col justify-center rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft">
              <h3 className="text-lg font-semibold">Explore the full curriculum</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Subject lists, methodology, assessment pattern and the school calendar.
              </p>
              <ActionLink to="/academics" variant="secondary" size="sm" className="mt-6 w-fit">
                View Academics
                <ArrowRight aria-hidden="true" className="size-4" />
              </ActionLink>
            </div>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}

export function LatestNotices() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Notice board"
        title="Latest notices"
        description="Examination routines, events and circulars, updated by the school office."
      />
      <StaggerGroup className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {notices.slice(0, 5).map((notice) => (
          <StaggerItem key={notice.id}>
            <NoticeCard notice={notice} compact />
          </StaggerItem>
        ))}
        <StaggerItem>
          <div className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
            <p className="text-sm font-semibold text-primary">Looking for something older?</p>
            <ActionLink to="/notices" variant="outline" size="sm" className="mx-auto mt-4 w-fit">
              All Notices
              <ArrowRight aria-hidden="true" className="size-4" />
            </ActionLink>
          </div>
        </StaggerItem>
      </StaggerGroup>
    </section>
  );
}

export function GalleryPreview() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="School life"
          title="Moments from our campus"
          description="Classrooms, the library, sports meets and cultural evenings through the year."
        />
        <div className="mt-12">
          <GalleryGrid items={galleryItems.slice(0, 6)} masonry={false} />
        </div>
        <div className="mt-10 text-center">
          <ActionLink to="/gallery" variant="outline" size="lg">
            View Full Gallery
            <ArrowRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </div>
      </div>
    </section>
  );
}

export function AchievementsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Achievements"
        title="What our students have accomplished"
      />
      <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((item) => (
          <StaggerItem key={item.id}>
            <InfoCard icon={item.icon} title={item.title} description={item.description} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

export function EventsSection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Calendar" title="Latest and upcoming events" />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {upcomingEvents.map((event) => (
            <StaggerItem key={event.id}>
              <article className="flex h-full gap-5 rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-fit shrink-0 place-items-center rounded-2xl bg-primary px-4 py-3 text-center text-primary-foreground">
                  <span className="text-lg font-bold">{event.date.split(" ")[0]}</span>
                  <span className="text-xs">{event.date.split(" ")[1]}</span>
                </span>
                <span className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
                  <p className="mt-1 text-xs text-primary">{event.location}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </span>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Testimonials"
        title="What parents and alumni say"
      />
      <div className="mt-12">
        <TestimonialCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}

export function MottoBanner() {
  return (
    <Reveal className="bg-primary-dark py-14">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold tracking-[0.24em] text-secondary uppercase">
          School motto
        </p>
        <p className="mt-4 text-2xl font-bold text-balance text-primary-foreground sm:text-3xl">
          {SCHOOL.motto}
        </p>
      </div>
    </Reveal>
  );
}
