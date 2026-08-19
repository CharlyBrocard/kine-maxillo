import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost-danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold text-center transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "bg-white border-[1.5px] border-border-input text-ink hover:border-accent",
  "ghost-danger": "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  md: "min-h-[56px] px-6 text-base",
  lg: "min-h-[56px] px-8 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
