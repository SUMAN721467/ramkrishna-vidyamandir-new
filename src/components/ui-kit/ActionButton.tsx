import { type ComponentProps, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-soft hover:bg-primary-dark hover:shadow-lift hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary-light hover:shadow-lift hover:-translate-y-0.5",
        outline: "border border-primary/25 bg-card text-primary hover:border-primary hover:bg-primary/5",
        ghost: "text-primary hover:bg-primary/8",
        glass: "glass-dark text-primary-foreground hover:bg-primary-foreground/15",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-6 text-sm",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof actionButtonVariants>;

interface ActionLinkProps extends Variants {
  to: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function ActionLink({ to, children, className, variant, size, ...rest }: ActionLinkProps) {
  return (
    <Link to={to} className={cn(actionButtonVariants({ variant, size }), className)} {...rest}>
      {children}
    </Link>
  );
}

interface ActionButtonProps extends ComponentProps<"button">, Variants {}

export function ActionButton({ className, variant, size, ...props }: ActionButtonProps) {
  return <button className={cn(actionButtonVariants({ variant, size }), className)} {...props} />;
}
