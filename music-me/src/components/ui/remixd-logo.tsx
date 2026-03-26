interface RemixdLogoProps {
  className?: string;
  height?: number;
  primaryColor?: string;
}

export function RemixdLogo({ className, height = 28, primaryColor = "#8b5cf6" }: RemixdLogoProps) {
  const aspectRatio = 432 / 252.17;
  const width = Math.round(height * aspectRatio);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 432 252.17"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="remixD"
    >
      <g style={{ isolation: "isolate" }}>
        <text
          fontFamily="BotchRegular, Botch"
          fontSize="98.25"
          fill="currentColor"
          transform="translate(0 186.93)"
        >r</text>
        <text
          fontFamily="BotchRegular, Botch"
          fontSize="98.25"
          fill="currentColor"
          transform="translate(53.45 186.93)"
        >
          <tspan>emi</tspan>
          <tspan fill={primaryColor} x="204.16" y="0">x</tspan>
        </text>
        <text
          fontFamily="BotchRegular, Botch"
          fontSize="98.25"
          fill={primaryColor}
          transform="translate(327.02 202.11)"
        >D</text>
      </g>
      <g style={{ isolation: "isolate" }}>
        <text
          fontFamily="BotchRegular, Botch"
          fontSize="107.65"
          fill={primaryColor}
          transform="translate(303.27 106.38)"
        >,</text>
      </g>
    </svg>
  );
}
