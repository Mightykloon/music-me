import Image from "next/image";

interface RemixdLogoProps {
  className?: string;
  height?: number;
}

export function RemixdLogo({ className, height = 28 }: RemixdLogoProps) {
  const aspectRatio = 432 / 252.17;
  const width = Math.round(height * aspectRatio);

  return (
    <Image
      src="/remixd.svg"
      alt="remixd"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
