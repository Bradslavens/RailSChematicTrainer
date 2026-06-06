import type { KeyboardEvent } from "react";
import type { Schematic, SchematicPoint, PointType } from "../lib/schematics.js";
import { polylineToPath, shieldPoints, diamondPoints } from "./geometry.js";

export interface SchematicViewProps {
  schematic: Schematic;
  /** Show every label (reference mode). Default false = blank schematic. */
  showLabels?: boolean;
  /** Point to emphasize (e.g. the prompt in a game). */
  highlightPointId?: string | null;
  /** Points whose labels are revealed even when showLabels is false. */
  revealedPointIds?: ReadonlySet<string>;
  /** Restrict which marker types are drawn. */
  visibleTypes?: PointType[];
  /** When provided, markers become tappable and call this on click. */
  onPointClick?: (point: SchematicPoint) => void;
}

export function SchematicView({
  schematic,
  showLabels = false,
  highlightPointId = null,
  revealedPointIds,
  visibleTypes,
  onPointClick,
}: SchematicViewProps) {
  const points = visibleTypes
    ? schematic.points.filter((p) => visibleTypes.includes(p.type))
    : schematic.points;

  return (
    <svg
      className="schematic"
      viewBox={schematic.viewBox.join(" ")}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Schematic: ${schematic.name}`}
    >
      <g className="schematic-tracks">
        {schematic.tracks.map((t) => (
          <path key={t.id} className="track" d={polylineToPath(t.polyline)} stroke={t.color} />
        ))}
      </g>
      <g className="schematic-points">
        {points.map((p) => (
          <Marker
            key={p.id}
            point={p}
            showLabel={showLabels || !!revealedPointIds?.has(p.id)}
            highlighted={p.id === highlightPointId}
            onClick={onPointClick}
          />
        ))}
      </g>
    </svg>
  );
}

function Glyph({ type }: { type: PointType }) {
  switch (type) {
    case "signal":
      return <circle className="glyph" r={7} />;
    case "station":
      return <rect className="glyph" x={-22} y={-10} width={44} height={20} rx={3} />;
    case "crossing":
      return <polygon className="glyph" points={diamondPoints(0, 0, 8)} />;
    case "milepost":
      return <polygon className="glyph" points={shieldPoints(0, 0, 10)} />;
    case "ss":
      return <rect className="glyph" x={-9} y={-9} width={18} height={18} rx={2} />;
    default:
      return <circle className="glyph" r={6} />;
  }
}

function Marker({
  point,
  showLabel,
  highlighted,
  onClick,
}: {
  point: SchematicPoint;
  showLabel: boolean;
  highlighted: boolean;
  onClick?: (point: SchematicPoint) => void;
}) {
  const interactive = !!onClick;
  const activate = () => onClick?.(point);
  const onKey = (e: KeyboardEvent) => {
    if (interactive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      activate();
    }
  };

  return (
    <g
      className={`marker marker--${point.type}${highlighted ? " is-highlighted" : ""}${interactive ? " is-interactive" : ""}`}
      data-point-id={point.id}
      data-point-type={point.type}
      transform={`translate(${point.x} ${point.y})`}
      onClick={interactive ? activate : undefined}
      onKeyDown={interactive ? onKey : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${point.type} marker` : undefined}
    >
      {interactive && <circle className="hit-area" r={18} />}
      {highlighted && <circle className="pulse" r={15} />}
      <Glyph type={point.type} />
      {showLabel && (
        <text className="marker-label" x={point.type === "station" ? 0 : 13} y={point.type === "station" ? 1 : 0}>
          {point.label}
        </text>
      )}
    </g>
  );
}
