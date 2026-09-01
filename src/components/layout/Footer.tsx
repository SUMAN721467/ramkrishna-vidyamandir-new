import { Link } from "@tanstack/react-router";
import { Facebook, GraduationCap, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { navigation, quickLinks, SCHOOL } from "@/data/site";

const socials = [
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
];

export function Footer() {
  return (
    <footer className="bg-primary-dark text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <GraduationCap aria-hidden="true" className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold">{SCHOOL.name}</span>
                <span className="block text-xs text-primary-foreground/70">
                  Established {SCHOOL.established}
                </span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-primary-foreground/75">
              {SCHOOL.tagline}. Nurturing curious minds and strong character in our mother tongue
              for nearly three decades.
            </p>
            <ul className="mt-6 flex items-center gap-3">
              {socials.map(({ label, href, icon: SocialIcon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${SCHOOL.shortName} on ${label}`}
                    className="inline-flex size-11 items-center justify-center rounded-full border border-primary-foreground/25 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                  >
                    <SocialIcon aria-hidden="true" className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-secondary uppercase">
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {navigation.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-primary-foreground/75 transition-colors hover:text-secondary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Quick links">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-secondary uppercase">
              Quick Links
            </h2>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-primary-foreground/75 transition-colors hover:text-secondary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-secondary uppercase">
              Reach Us
            </h2>
            <ul className="mt-5 space-y-4 text-sm text-primary-foreground/75">
              <li className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                <address className="not-italic">{SCHOOL.address}</address>
              </li>
              <li className="flex gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                <a href={`tel:${SCHOOL.phone.replace(/\s/g, "")}`} className="hover:text-secondary">
                  {SCHOOL.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                <a href={`mailto:${SCHOOL.email}`} className="break-all hover:text-secondary">
                  {SCHOOL.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
          </p>
          <p>{SCHOOL.motto}</p>
        </div>
      </div>
    </footer>
  );
}
