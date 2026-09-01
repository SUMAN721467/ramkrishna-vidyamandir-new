import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
}

export function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-primary-dark">
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1920}
        height={1080}
        className="absolute inset-0 size-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/85 to-primary/60" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <motion.nav
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-1 text-xs font-medium text-primary-foreground/70"
        >
          <Link to="/" className="hover:text-secondary">
            Home
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span className="text-secondary">{eyebrow}</span>
        </motion.nav>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="max-w-3xl text-4xl font-bold text-balance text-primary-foreground sm:text-5xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/80"
        >
          {description}
        </motion.p>
      </div>
    </section>
  );
}
