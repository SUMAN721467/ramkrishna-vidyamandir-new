import { createFileRoute } from "@tanstack/react-router";
import library from "@/assets/library.jpg";
import computerLab from "@/assets/computer-lab.jpg";
import scienceLab from "@/assets/science-lab.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { InfoCard } from "@/components/ui-kit/InfoCard";
import { StaggerGroup, StaggerItem, Reveal } from "@/components/ui-kit/Reveal";
import { CtaBanner } from "@/components/ui-kit/CtaBanner";
import { facilities } from "@/data/school";

const title = "Campus Facilities — Ramkrishna Vidyamandir";
const description =
  "Smart classrooms, library, computer and science labs, playground, pure drinking water and school transport at Ramkrishna Vidyamandir, Barasat.";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/facilities" },
    ],
    links: [{ rel: "canonical", href: "/facilities" }],
  }),
  component: FacilitiesPage,
});

const highlights = [
  { id: "h1", src: library, alt: "Students reading in the school library", label: "Library wing" },
  { id: "h2", src: computerLab, alt: "Students working in the computer laboratory", label: "Computer lab" },
  { id: "h3", src: scienceLab, alt: "Students performing science experiments", label: "Science lab" },
];

function FacilitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Facilities"
        title="A campus designed around everyday learning"
        description="Everything a student needs for study, sport and safety — maintained and monitored daily."
        image={library}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="On campus" title="Facilities for every student" />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility) => (
            <StaggerItem key={facility.id}>
              <InfoCard
                icon={facility.icon}
                title={facility.title}
                description={facility.description}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="A closer look" title="Inside our learning spaces" />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.08}>
                <figure className="group overflow-hidden rounded-3xl bg-card shadow-soft">
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    width={1280}
                    height={960}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <figcaption className="px-5 py-4 text-sm font-semibold text-foreground">
                    {item.label}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="rounded-[2rem] border border-border/70 bg-card p-8 shadow-soft sm:p-10">
          <h2 className="text-xl font-semibold text-foreground">Transport information</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Six GPS-tracked school buses operate on fixed routes covering Barasat, Madhyamgram,
            Duttapukur and New Barrackpore. Each bus carries a trained attendant, and pick-up and
            drop timings are shared with guardians at the start of every session. Transport charges
            depend on distance and are payable quarterly at the school office.
          </p>
        </Reveal>
      </section>

      <CtaBanner />
    </>
  );
}
