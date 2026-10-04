import type { ImgHTMLAttributes } from "react";

type LogoProps = ImgHTMLAttributes<HTMLImageElement> & {
  withWordmark?: boolean;
};

const BRAND_MARK = "/brand/global-stock-logo.png";

export function Logo({
  withWordmark = false,
  className,
  alt = "Global Stock",
  ...props
}: LogoProps) {
  if (withWordmark) {
    return (
      <div className={`flex min-w-0 items-center gap-3 ${className ?? ""}`}>
        <img
          src={BRAND_MARK}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="min-w-0 leading-none">
          <div className="truncate text-[15px] font-semibold tracking-[-0.03em]">
            Global Stock
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={BRAND_MARK}
      alt={alt}
      draggable={false}
      className={`object-contain ${className ?? ""}`}
      {...props}
    />
  );
}
