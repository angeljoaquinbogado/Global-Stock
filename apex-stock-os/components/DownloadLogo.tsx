import type { SVGProps } from "react";

export function DownloadLogo({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Global Stock"
      className={className}
      {...props}
    >
      <path
        d="M32 5.25 53.25 17.5v24.55L32 54.35 10.75 42.05V17.5L32 5.25Z"
        fill="#8F0000"
      />
      <path
        d="m32 5.25 21.25 12.25L32 29.78 10.75 17.5 32 5.25Z"
        fill="#B00000"
      />
      <path
        d="M32 29.78 53.25 17.5v24.55L32 54.35V29.78Z"
        fill="#720000"
      />

      <path
        d="M19.35 25.2v13.65M25.55 28.55v14.05M31.75 31.95v13.6"
        stroke="white"
        strokeWidth="3.7"
        strokeLinecap="round"
      />

      <path
        d="m39.2 23 4.75 2.78v11.92l-4.75 2.78V23Z"
        fill="white"
      />

      <circle cx="46.85" cy="20.65" r="2.18" fill="white" />
      <circle cx="46.85" cy="43.15" r="2.18" fill="white" />
      <path
        d="M46.85 23.05v17.7"
        stroke="white"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeDasharray="2.25 3.15"
      />
    </svg>
  );
}
