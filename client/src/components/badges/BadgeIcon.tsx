import { useState } from 'react';
import { BADGE_FALLBACK_ICON } from '../../services/badgeService';

interface BadgeIconProps {
  src: string;
  alt: string;
  /** Rendered pixel size (square). */
  size: number;
  /** Locked badges render desaturated and faded. */
  locked?: boolean;
}

/** Badge artwork with a graceful fallback when the SVG file is missing. */
export function BadgeIcon({ src, alt, size, locked = false }: BadgeIconProps) {
  const [failed, setFailed] = useState(false);
  // "Adjust state during render" idiom (see react.dev): compare props to the
  // last-seen value while rendering and call setState synchronously if they
  // differ. React discards this render and re-renders with the new state
  // before committing/painting, so a changed `src` resets `failed` on the
  // very same render pass — no effect, no extra commit, no stale-fallback flash.
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
  }

  return (
    <img
      src={failed ? BADGE_FALLBACK_ICON : src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: locked ? 'grayscale(1)' : undefined,
        opacity: locked ? 0.35 : 1,
      }}
    />
  );
}
