import { Link, useLocation } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";

/** Persistent admission call-to-action pinned to the bottom on small screens. */
export function StickyAdmission() {
  const location = useLocation();
  if (location.pathname === "/admissions") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/95 p-3 backdrop-blur-md sm:hidden">
      <Link
        to="/admissions"
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-bold text-secondary-foreground shadow-soft"
      >
        <ClipboardCheck aria-hidden="true" className="size-4" />
        Admissions Open — Apply Now
      </Link>
    </div>
  );
}
