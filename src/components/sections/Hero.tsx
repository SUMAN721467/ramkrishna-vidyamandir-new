import { motion } from "motion/react";
import { ArrowRight, ChevronDown, PhoneCall, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";
import { SCHOOL } from "@/data/site";
import { ActionLink } from "@/components/ui-kit/ActionButton";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92dvh] items-center overflow-hidden">
      <img
        src={heroImage}
        alt="Students of Ramkrishna Vidyamandir walking in the school courtyard"
        width={1920}
        height={1080}
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/92 via-primary-dark/75 to-primary/50" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-[0.16em] text-secondary uppercase"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          Since {SCHOOL.established} · Keshiary, West Bengal
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-6 max-w-3xl text-4xl leading-tight font-extrabold text-balance text-primary-foreground sm:text-5xl lg:text-6xl"
        >
          {SCHOOL.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-5 max-w-xl text-lg text-primary-foreground/85"
        >
          {SCHOOL.tagline} — nurturing knowledge, character and confidence in our mother tongue.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-9 flex flex-wrap gap-3"
        >
          <ActionLink to="/admissions" variant="secondary" size="lg">
            Admission Open
            <ArrowRight aria-hidden="true" className="size-4" />
          </ActionLink>
          <ActionLink to="/contact" variant="glass" size="lg">
            <PhoneCall aria-hidden="true" className="size-4" />
            Contact Us
          </ActionLink>
        </motion.div>
      </div>

      <motion.a
        href="#highlights"
        aria-label="Scroll to school highlights"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute inset-x-0 bottom-24 mx-auto hidden w-fit flex-col items-center gap-2 text-primary-foreground/80 sm:bottom-8 sm:flex"
      >
        <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="inline-flex size-10 items-center justify-center rounded-full border border-primary-foreground/30"
        >
          <ChevronDown aria-hidden="true" className="size-5" />
        </motion.span>
      </motion.a>
    </section>
  );
}
