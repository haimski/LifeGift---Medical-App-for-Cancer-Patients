interface LogoProps {
  className?: string;
}

/**
 * The Lumina Care AI brand mark: a pink heart, a white circle at its
 * center, and a pink cross inside that circle. Fixed brand colors (not
 * theme-token-driven) — a static mark, not adaptive chrome.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="#ec4899"
      />
      <circle cx="12" cy="9.8" r="4.2" fill="#fff" />
      <rect x="9.5" y="8.95" width="5" height="1.7" rx="0.6" fill="#ec4899" />
      <rect x="11.15" y="7.3" width="1.7" height="5" rx="0.6" fill="#ec4899" />
    </svg>
  );
}
