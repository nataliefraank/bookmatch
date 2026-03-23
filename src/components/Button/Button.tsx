"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import "./Button.css";

export interface ButtonProps {
  Title: string;
  /** `true` uses Next.js `<Link>`; `false` uses a `<button>` with `router.push`. */
  Link: boolean;
  URL?: string;
  /** `true` = solid fill; `false` = ghost/outline. */
  Fill: boolean;
  /** Theme token for styling, e.g. `cream` (filled) or `white` (ghost). */
  Color: string;
}

const Button = ({
  Title,
  Link: asLink,
  URL,
  Fill,
  Color,
}: ButtonProps) => {
  const router = useRouter();
  const colorKey = Color.toLowerCase().replace(/\s+/g, "-");
  const className = [
    "pill-button",
    Fill ? "pill-button--fill" : "pill-button--ghost",
    `pill-button--${Fill ? "fill" : "ghost"}-${colorKey}`,
  ].join(" ");

  if (asLink && URL) {
    return (
      <Link href={URL} className={className}>
        {Title}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (URL) router.push(URL);
      }}
    >
      {Title}
    </button>
  );
};

export default Button;
