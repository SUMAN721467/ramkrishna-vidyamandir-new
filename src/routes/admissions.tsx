import { createFileRoute } from "@tanstack/react-router";
import { Download, Mail, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import heroStudents from "@/assets/hero-students.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { InfoCard } from "@/components/ui-kit/InfoCard";
import { ActionButton } from "@/components/ui-kit/ActionButton";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui-kit/Reveal";
import { FaqAccordion } from "@/components/ui-kit/FaqAccordion";
import { faqs } from "@/data/school";
import { SCHOOL } from "@/data/site";

const title = "Admissions 2027–28 — Ramkrishna Vidyamandir";
const description =
  "Admission process, eligibility, required documents and fee information for LKG to Class IX at Ramkrishna Vidyamandir, Keshiary.";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/admissions" },
    ],
    links: [{ rel: "canonical", href: "/admissions" }],
  }),
  component: AdmissionsPage,
});

const steps = [
  { id: "s1", icon: "FileText", title: "1. Collect the form", description: "Available at the school office or downloadable from this page during December and January." },
  { id: "s2", icon: "PenLine", title: "2. Submit documents", description: "Return the completed form with attested copies of all required documents." },
  { id: "s3", icon: "MessagesSquare", title: "3. Interaction", description: "A short, friendly interaction with the child and guardians — no written entrance test for LKG and UKG." },
  { id: "s4", icon: "BadgeCheck", title: "4. Confirmation", description: "Selected names are posted on the notice board; fees are paid at the office within a week." },
];

const eligibility = [
  "LKG: minimum 3 years as on 1 January of the admission year",
  "UKG: minimum 4 years, or successful completion of LKG",
  "Class I: minimum 5 years, with a UKG transfer or completion certificate",
  "Class II – IX: transfer certificate and previous year mark sheet required",
];

const documents = [
  "Birth certificate (photocopy with original for verification)",
  "Transfer certificate from the previous school, if applicable",
  "Previous year mark sheet / report card",
  "Four recent passport-size photographs of the student",
  "Aadhaar copy of the student and guardian",
  "Residential proof of the guardian",
];

const fees = [
  { id: "f1", level: "LKG – UKG", admission: "₹ 2,500", monthly: "₹ 450" },
  { id: "f2", level: "Class I – IV", admission: "₹ 3,000", monthly: "₹ 550" },
  { id: "f3", level: "Class V – VIII", admission: "₹ 3,500", monthly: "₹ 700" },
  { id: "f4", level: "Class IX – X", admission: "₹ 4,000", monthly: "₹ 900" },
];

function AdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Admissions open for the 2027–28 session"
        description="LKG to Class IX. Forms are issued from the first week of December and close on 31 January."
        image={heroStudents}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Process" title="Four simple steps" />
        <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StaggerItem key={step.id}>
              <InfoCard icon={step.icon} title={step.title} description={step.description} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Eligibility" title="Who can apply" align="left" />
            <ul className="mt-8 space-y-3">
              {eligibility.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-border/70 bg-card px-5 py-4 text-sm text-foreground shadow-soft"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Documents" title="What to bring" align="left" />
            <ul className="mt-8 space-y-3">
              {documents.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-border/70 bg-card px-5 py-4 text-sm text-foreground shadow-soft"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Fees"
          title="Fee information"
          description="Indicative figures for the 2027–28 session. Final fees are confirmed at the time of admission."
        />
        <Reveal className="mt-12 overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-soft">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Indicative admission and monthly fees by class level</caption>
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Level</th>
                <th scope="col" className="px-5 py-3 font-semibold">Admission fee</th>
                <th scope="col" className="px-5 py-3 font-semibold">Monthly fee</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="px-5 py-3 font-medium text-foreground">{row.level}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.admission}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.monthly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ActionButton
            size="lg"
            onClick={() =>
              toast.info("Admission form download", {
                description: "The printable form will be available here once the session opens.",
              })
            }
          >
            <Download aria-hidden="true" className="size-4" />
            Download Admission Form
          </ActionButton>
          <a
            href={`tel:${SCHOOL.phone.replace(/\s/g, "")}`}
            className="inline-flex h-13 items-center gap-2 rounded-full border border-primary/25 bg-card px-7 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <PhoneCall aria-hidden="true" className="size-4" />
            {SCHOOL.phone}
          </a>
          <a
            href={`mailto:${SCHOOL.admissionEmail}`}
            className="inline-flex h-13 items-center gap-2 rounded-full border border-primary/25 bg-card px-7 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <Mail aria-hidden="true" className="size-4" />
            Email admissions
          </a>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Admission questions" />
          <div className="mt-12">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>
    </>
  );
}
