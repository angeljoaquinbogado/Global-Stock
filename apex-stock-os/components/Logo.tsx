import type { ImgHTMLAttributes } from "react";

type LogoProps = ImgHTMLAttributes<HTMLImageElement> & {
  withWordmark?: boolean;
};

export function Logo({
  withWordmark = false,
  className,
  alt = "Global Stock",
  ...props
}: LogoProps) {
  if (withWordmark) {
    return (
      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        <img
          src="/global-stock-logo.png"
          alt=""
          className="h-10 w-10 shrink-0 rounded-[10px] object-contain"
          aria-hidden="true"
        />
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-[-0.03em]">
            Global Stock
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/global-stock-logo.png"
      alt={alt}
      className={className}
      {...props}
    />
  );
}
