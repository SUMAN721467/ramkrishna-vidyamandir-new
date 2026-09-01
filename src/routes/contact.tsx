import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import campus from "@/assets/campus.jpg";
import { PageHero } from "@/components/ui-kit/PageHero";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { ContactForm } from "@/components/ui-kit/ContactForm";
import { FaqAccordion } from "@/components/ui-kit/FaqAccordion";
import { Reveal } from "@/components/ui-kit/Reveal";
import { faqs } from "@/data/school";
import { SCHOOL } from "@/data/site";

const title = "Contact Us — Ramkrishna Vidyamandir";
const description =
  "Address, phone numbers, email and office hours of Ramkrishna Vidyamandir, Keshiary, along with an enquiry form for guardians.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We would be glad to hear from you"
        description="Visit the campus, call the office, or send us a message and we will respond within two working days."
        image={campus}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Reach us" title="School office" align="left" />
            <ul className="mt-8 space-y-5">
              <li className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Address</span>
                  <address className="mt-1 text-sm text-muted-foreground not-italic">
                    {SCHOOL.address}
                  </address>
                </span>
              </li>
              <li className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Phone</span>
                  <a
                    href={`tel:${SCHOOL.phone.replace(/\s/g, "")}`}
                    className="mt-1 block text-sm text-muted-foreground hover:text-primary"
                  >
                    {SCHOOL.phone}
                  </a>
                  {SCHOOL.altPhone && (
                    <a
                      href={`tel:${SCHOOL.altPhone.replace(/\s/g, "")}`}
                      className="block text-sm text-muted-foreground hover:text-primary"
                    >
                      {SCHOOL.altPhone}
                    </a>
                  )}
                </span>
              </li>
              <li className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Email</span>
                  <a
                    href={`mailto:${SCHOOL.email}`}
                    className="mt-1 block text-sm break-all text-muted-foreground hover:text-primary"
                  >
                    {SCHOOL.email}
                  </a>
                </span>
              </li>
              <li className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Office hours</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {SCHOOL.officeHours}
                  </span>
                </span>
              </li>
            </ul>

            <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center">
              <MapPin aria-hidden="true" className="size-8 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Map location</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aurangabad, Keshiary, Paschim Medinipur — an interactive map will be embedded here.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Enquiry" title="Send us a message" align="left" />
            <div className="mt-8 rounded-3xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Common questions" />
          <div className="mt-12">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>
    </>
  );
}
