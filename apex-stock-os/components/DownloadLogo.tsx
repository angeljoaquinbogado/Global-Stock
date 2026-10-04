import type { ImgHTMLAttributes } from "react";

export function DownloadLogo({
  className,
  alt = "Global Stock",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/brand/global-stock-logo.png"
      alt={alt}
      draggable={false}
      className={`object-contain ${className ?? ""}`}
      {...props}
    />
  );
}
