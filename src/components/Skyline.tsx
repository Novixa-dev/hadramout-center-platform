/** Decorative skyline of mud-brick towers (Shibam-style), as solid silhouettes. Deterministic so server and client render identically. */
const TOWERS = [
  [0, 46, 30], [32, 70, 26], [60, 54, 34], [96, 86, 28], [126, 62, 24], [152, 94, 30], [184, 58, 26], [212, 78, 32], [246, 50, 28], [276, 90, 26],
  [304, 66, 34], [340, 100, 28], [370, 72, 24], [396, 56, 32], [430, 88, 28], [460, 64, 26], [488, 96, 34], [524, 60, 24], [550, 82, 30], [582, 52, 28],
  [612, 92, 26], [640, 68, 32], [674, 56, 28], [704, 98, 30], [736, 62, 26], [764, 84, 34], [800, 54, 24], [826, 90, 28], [856, 66, 30], [888, 76, 26],
  [916, 100, 32], [950, 58, 28], [980, 86, 26], [1008, 64, 34], [1044, 94, 28], [1074, 60, 30], [1106, 80, 26], [1134, 52, 32], [1168, 70, 32],
] as const;

export function Skyline({ className }: { className?: string }) {
  const H = 110;
  const d = TOWERS.map(([x, h, w]) => {
    const y = H - h;
    // Solid towers only: the svg is stretched to a 2-4rem band, which squashed the small window cut-outs into dark smudges.
    return `M${x} ${H}V${y + 4}h${w}V${H}z`;
  }).join(' ');
  return (
    <svg className={className} viewBox={`0 0 1200 ${H}`} preserveAspectRatio="none" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
