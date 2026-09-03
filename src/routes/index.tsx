import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import {
  StatsSection,
  AboutPreview,
  WhyChooseUs,
  ActivitiesSection,
} from "@/components/sections/HomeIntro";
import {
  AcademicLevelsSection,
  LatestNotices,
  GalleryPreview,
  AchievementsSection,
  EventsSection,
  TestimonialsSection,
  MottoBanner,
} from "@/components/sections/HomeSections";
import { CtaBanner } from "@/components/ui-kit/CtaBanner";
import { FaqAccordion } from "@/components/ui-kit/FaqAccordion";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { faqs } from "@/data/school";

const title = "Ramkrishna Vidyamandir — Bengali Medium Co-Educational School";
const description =
  "Ramkrishna Vidyamandir, Keshiary: a Bengali medium private co-educational school for Play to Class X with experienced teachers, smart classrooms and a safe campus.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <StatsSection />
      <AboutPreview />
      <WhyChooseUs />
      <AcademicLevelsSection />
      <ActivitiesSection />
      <MottoBanner />
      <LatestNotices />
      <GalleryPreview />
      <AchievementsSection />
      <EventsSection />
      <TestimonialsSection />
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-12">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
