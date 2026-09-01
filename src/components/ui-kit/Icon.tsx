import { icons } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string;
}

/** Renders a Lucide icon by its string name from the typed data files. */
export function Icon({ name, className }: IconProps) {
  const LucideIcon = icons[name as keyof typeof icons];
  if (!LucideIcon) return null;
  return <LucideIcon aria-hidden="true" className={cn("size-6", className)} />;
}
