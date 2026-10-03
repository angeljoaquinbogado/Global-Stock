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
          src="/brand/global-stock-logo.png"
          alt=""
          className="h-10 w-10 shrink-0 object-contain"
          aria-hidden="true"
          draggable={false}
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
      src="/brand/global-stock-logo.png"
      alt={alt}
      className={className}
      draggable={false}
      {...props}
    />
  );
}
