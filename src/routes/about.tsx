import { createFileRoute } from "@tanstack/react-router";
import { Eye, Heart, Target } from "lucide-react";
import campus from "@/assets/campus.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { InfoCard } from "@/components/ui-kit/InfoCard";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui-kit/Reveal";
import { Timeline } from "@/components/ui-kit/Timeline";
import { CtaBanner } from "@/components/ui-kit/CtaBanner";
import { timeline } from "@/data/school";
import { SCHOOL } from "@/data/site";

const title = "About Our School — Ramkrishna Vidyamandir";
const description =
  "The history, mission, vision, values and principal's message of Ramkrishna Vidyamandir, a Bengali medium co-educational school established in 1996.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const values = [
  { id: "v1", icon: "BookHeart", title: "Respect for the Mother Tongue", description: "We teach in Bengali because clarity of thought begins in the language of home." },
  { id: "v2", icon: "Scale", title: "Discipline with Kindness", description: "Firm routines, never fear. Every child is corrected with dignity." },
  { id: "v3", icon: "Sprout", title: "Curiosity First", description: "Questions are welcomed in every classroom, on every subject." },
  { id: "v4", icon: "HandHeart", title: "Service to Society", description: "Students take part in cleanliness drives, tree planting and community programmes." },
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Nearly three decades of teaching in our mother tongue"
        description="From three rented rooms in 1996 to a full-fledged campus serving over 1,200 students today."
        image={campus}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Our history" title="How the school began" align="left" />
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              In 1996 a group of local teachers and guardians in Keshiary noticed that bright
              children were struggling — not with ideas, but with the language those ideas were
              taught in. They pooled their savings, rented three rooms in Aurangabad, Keshiary and
              opened {SCHOOL.name} with sixty-two students.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The school moved to its own campus in 2002, received recognition up to Class X in
              2008, and has since added science and computer laboratories, smart classrooms and a
              three-storey library wing. What has not changed is the founding belief: a strong
              Bengali medium education, affordable to every family in the neighbourhood.
            </p>
          </Reveal>

          <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <StaggerItem>
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
                <Target aria-hidden="true" className="size-8 text-primary" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Our Mission</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  To provide affordable, high quality Bengali medium education that develops
                  academic strength, moral clarity and social responsibility in every student.
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
                <Eye aria-hidden="true" className="size-8 text-primary" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Our Vision</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  To be the school of choice in Paschim Medinipur for families who want modern
                  learning without losing their language, culture and values.
                </p>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-4xl rounded-[2rem] border border-border/70 bg-card p-8 shadow-soft sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground">
                P
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-foreground">Principal&rsquo;s Message</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;A school is not its building; it is the quality of attention an adult gives
                  a child. At Ramkrishna Vidyamandir we keep our sections small so that no student
                  is a stranger to their teacher. We ask our children to be honest before they are
                  brilliant, and curious before they are correct. To every guardian considering us:
                  come and sit in a classroom for an hour. That will tell you more than any
                  prospectus.&rdquo;
                </p>
                <p className="mt-5 text-sm font-semibold text-primary">Principal</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Our values"
          title="What we stand for"
          description="Four principles that guide every decision on this campus."
        />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <StaggerItem key={value.id}>
              <InfoCard icon={value.icon} title={value.title} description={value.description} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Milestones" title="Our journey so far" />
          <div className="mt-12">
            <Timeline events={timeline} />
          </div>
        </div>
      </section>

      <div className="hidden">
        <Heart aria-hidden="true" />
      </div>
      <CtaBanner />
    </>
  );
}
