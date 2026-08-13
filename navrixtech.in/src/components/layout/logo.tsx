import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
};

const gradientId = "navrix-logo-gradient";

export function Logo({ className, showWordmark = true }: LogoProps) {  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="8" stroke={`url(#${gradientId})`} strokeWidth="2" />
        <path
          d="M9 23V9h2l10 11V9h2v14h-2L11 12v11H9z"
          fill={`url(#${gradientId})`}
        />
      </svg>
      {showWordmark && (
        <span className="text-xl font-bold tracking-tight gradient-accent-text">
          Navrix
        </span>
      )}
    </span>
  );
}

export default Logo;
