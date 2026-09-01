import { ArrowRight, CheckCircle2 } from "lucide-react";
import campusImage from "@/assets/campus.jpg";
import { SCHOOL } from "@/data/site";
import { statistics, features, activities } from "@/data/school";
import { StatCard } from "@/components/ui-kit/StatCard";
import { InfoCard } from "@/components/ui-kit/InfoCard";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui-kit/Reveal";
import { ActionLink } from "@/components/ui-kit/ActionButton";
import { Icon } from "@/components/ui-kit/Icon";

export function StatsSection() {
  return (
    <section id="highlights" className="mx-auto -mt-16 max-w-6xl px-4 sm:px-6">
      <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statistics.map((stat) => (
          <StaggerItem key={stat.id}>
            <StatCard stat={stat} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

const aboutPoints = [
  "Recognised Bengali medium school from LKG to Class X",
  "Average of one teacher for every 26 students",
  "Scholarships and fee waivers for deserving students",
];

export function AboutPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative">
          <img
            src={campusImage}
            alt="Ramkrishna Vidyamandir main academic building and lawn"
            loading="lazy"
            width={1280}
            height={960}
            className="w-full rounded-[2rem] object-cover shadow-lift"
          />
          <div className="glass-panel absolute -right-2 -bottom-6 rounded-3xl px-6 py-4 shadow-lift sm:right-6">
            <p className="text-2xl font-bold text-primary">{SCHOOL.established}</p>
            <p className="text-xs text-muted-foreground">Year of establishment</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <SectionHeading
            eyebrow="About the school"
            title="A neighbourhood school with a state-wide reputation"
            align="left"
          />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Ramkrishna Vidyamandir began in 1996 with sixty-two children and a simple conviction:
            that a child learns best in the language they dream in. Nearly three decades later we
            teach over 1,200 students across LKG to Class X, blending disciplined academics with
            music, sport and service.
          </p>
          <ul className="mt-6 space-y-3">
            {aboutPoints.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-foreground">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>
          <ActionLink to="/about" variant="outline" size="lg" className="mt-8">
            Read More
            <ArrowRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </Reveal>
      </div>
    </section>
  );
}

export function WhyChooseUs() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Why choose us"
          title="Six reasons families trust us with their children"
          description="Everything we do is built around one question: is this good for the child in front of us?"
        />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.id}>
              <InfoCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

export function ActivitiesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Beyond the classroom"
        title="Activities that build well-rounded students"
        description="Every child takes part in at least one creative and one physical activity each term."
      />
      <StaggerGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <StaggerItem key={activity.id}>
            <div className="group flex h-full items-start gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-lift">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-primary transition-transform duration-300 group-hover:scale-110">
                <Icon name={activity.icon} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{activity.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {activity.description}
                </span>
              </span>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
