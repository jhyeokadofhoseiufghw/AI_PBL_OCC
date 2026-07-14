import Image from "next/image";

import dashboardLogo from "../../docs/design/logo-dashboard.png";
import publicLogo from "../../docs/design/logo-public.png";

export function BrandLogo({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "dashboard";
}) {
  const isDashboard = variant === "dashboard";

  return (
    <span
      aria-hidden="true"
      className={`relative block h-14 w-[4.25rem] translate-y-[3px] shrink-0 bg-transparent ${className}`}
    >
      <Image
        alt=""
        className="h-full w-full object-contain"
        priority
        src={isDashboard ? dashboardLogo : publicLogo}
      />
    </span>
  );
}
