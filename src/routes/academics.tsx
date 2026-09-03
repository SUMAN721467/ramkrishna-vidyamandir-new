import { createFileRoute } from "@tanstack/react-router";
import classroom from "@/assets/classroom.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { InfoCard } from "@/components/ui-kit/InfoCard";
import { Icon } from "@/components/ui-kit/Icon";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui-kit/Reveal";
import { CtaBanner } from "@/components/ui-kit/CtaBanner";
import { academicLevels } from "@/data/school";

const title = "Academics & Curriculum — Ramkrishna Vidyamandir";
const description =
  "Bengali medium curriculum from Play to Class X, teaching methodology, assessment pattern and the annual school calendar at Ramkrishna Vidyamandir.";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/academics" },
    ],
    links: [{ rel: "canonical", href: "/academics" }],
  }),
  component: AcademicsPage,
});

const methodology = [
  { id: "m1", icon: "MessagesSquare", title: "Dialogue, not dictation", description: "Lessons open with questions; students explain concepts back in their own words." },
  { id: "m2", icon: "MonitorPlay", title: "Audio-visual support", description: "Smart board lessons and animations for difficult topics in science and geography." },
  { id: "m3", icon: "Users", title: "Group project work", description: "Every term includes at least one collaborative project per subject." },
  { id: "m4", icon: "HeartHandshake", title: "Remedial support", description: "Extra morning classes for students who need more time, at no additional cost." },
];

const assessment = [
  { id: "as1", name: "First Unit Test", weight: "10%", period: "April" },
  { id: "as2", name: "First Summative", weight: "20%", period: "July" },
  { id: "as3", name: "Second Unit Test", weight: "10%", period: "August" },
  { id: "as4", name: "Second Summative", weight: "20%", period: "September" },
  { id: "as5", name: "Project & Internal", weight: "10%", period: "Continuous" },
  { id: "as6", name: "Annual Examination", weight: "30%", period: "December" },
];

const calendar = [
  { id: "c1", term: "Session begins", months: "January" },
  { id: "c2", term: "Saraswati Puja & cultural week", months: "January – February" },
  { id: "c3", term: "Summer vacation", months: "June" },
  { id: "c4", term: "Annual sports meet", months: "September" },
  { id: "c5", term: "Puja vacation", months: "October" },
  { id: "c6", term: "Annual examination & results", months: "December" },
];

function AcademicsPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="A Bengali medium curriculum built for real understanding"
        description="Aligned with the West Bengal Board of Secondary Education, from kindergarten to Madhyamik."
        image={classroom}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Curriculum"
          title="Classes and stages"
          description="Medium of instruction: Bengali. English and Hindi are taught as language subjects."
        />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {academicLevels.map((level) => (
            <StaggerItem key={level.id}>
              <article className="h-full rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
        </StaggerGroup>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Methodology" title="How we teach" />
          <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {methodology.map((item) => (
              <StaggerItem key={item.id}>
                <InfoCard icon={item.icon} title={item.title} description={item.description} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Assessment" title="Evaluation pattern" align="left" />
            <div className="mt-8 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Assessment weightage through the academic year</caption>
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Assessment</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Period</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.map((row) => (
                    <tr key={row.id} className="border-t border-border/70">
                      <td className="px-5 py-3 text-foreground">{row.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{row.period}</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">
                        {row.weight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Calendar" title="School calendar" align="left" />
            <ul className="mt-8 space-y-4">
              {calendar.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-soft"
                >
                  <span className="min-w-0 text-sm font-medium text-foreground">{item.term}</span>
                  <span className="shrink-0 rounded-full bg-secondary/25 px-3 py-1 text-xs font-semibold text-primary">
                    {item.months}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
