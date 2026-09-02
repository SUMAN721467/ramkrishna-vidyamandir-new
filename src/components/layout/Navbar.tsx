import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { GraduationCap, Menu, X } from "lucide-react";
import { navigation, SCHOOL } from "@/data/site";
import { cn } from "@/lib/utils";
import { ActionLink } from "@/components/ui-kit/ActionButton";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { role, user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "glass-panel shadow-soft" : "bg-card/80 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={`${SCHOOL.name} home`}>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <GraduationCap aria-hidden="true" className="size-6" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-primary sm:text-base">
              {SCHOOL.name}
            </span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">
              {SCHOOL.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/8 hover:text-primary data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/portal"
            className="rounded-full px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 flex items-center gap-1.5"
          >
            {role ? 'Portal Dashboard' : 'Portal'}
          </Link>
          <ActionLink to="/admissions" size="sm" className="ml-2">
            Admission
          </ActionLink>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-primary lg:hidden"
        >
          {open ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/70 bg-card lg:hidden"
          >
            <ul className="mx-auto max-w-6xl space-y-1 px-4 py-4 sm:px-6">
              {navigation.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className="block rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/8 data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/portal"
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
                >
                  {role ? 'School Portal Dashboard' : 'School Portal Login'}
                </Link>
              </li>
              <li className="pt-2">
                <ActionLink to="/admissions" size="md" className="w-full">
                  Admission Open
                </ActionLink>
              </li>
            </ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
