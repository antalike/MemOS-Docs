'use client';

import { useEffect, useState, type CSSProperties } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
}

interface StarLayer {
  stars: Star[];
  duration: number;
  opacity: number;
}

// Mirrors the legacy Nuxt `StarsBg.vue`: three layers rising at different
// speeds/opacities, masked to fade in/out vertically.
const speedMap = {
  slow: { duration: 200, opacity: 0.5, ratio: 0.3 },
  normal: { duration: 150, opacity: 0.75, ratio: 0.3 },
  fast: { duration: 100, opacity: 1, ratio: 0.4 },
} as const;

function generateStars(count: number, min: number, max: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.floor(Math.random() * 2000),
    y: Math.floor(Math.random() * 2000),
    size: Math.random() * (max - min) + min,
  }));
}

export function StarsBg({
  starCount = 300,
  color = 'var(--color-fd-primary)',
  size = { min: 1, max: 2 },
}: {
  starCount?: number;
  color?: string;
  size?: { min: number; max: number };
}) {
  // Generate on the client only so the random positions don't cause a
  // server/client hydration mismatch.
  const [layers, setLayers] = useState<StarLayer[]>([]);

  useEffect(() => {
    setLayers([
      {
        stars: generateStars(
          Math.floor(starCount * speedMap.fast.ratio),
          size.min,
          size.max,
        ),
        duration: speedMap.fast.duration,
        opacity: speedMap.fast.opacity,
      },
      {
        stars: generateStars(
          Math.floor(starCount * speedMap.normal.ratio),
          size.min,
          size.max,
        ),
        duration: speedMap.normal.duration,
        opacity: speedMap.normal.opacity,
      },
      {
        stars: generateStars(
          Math.floor(starCount * speedMap.slow.ratio),
          size.min,
          size.max,
        ),
        duration: speedMap.slow.duration,
        opacity: speedMap.slow.opacity,
      },
    ]);
  }, [starCount, size.min, size.max]);

  return (
    <div className="pointer-events-none absolute inset-x-5 inset-y-0 z-[-1] overflow-hidden sm:inset-x-7 lg:inset-x-9">
      <div className="stars-bg absolute inset-x-0 top-0 left-1/2 size-full -translate-x-1/2">
        {layers.map((layer, index) => (
          <div
            key={index}
            className="stars-bg-layer"
            style={{ '--star-duration': `${layer.duration}s` } as CSSProperties}
          >
            {layer.stars.map((star, starIndex) => (
              <div
                key={starIndex}
                className="absolute rounded-full"
                style={{
                  left: `${star.x}px`,
                  top: `${star.y}px`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: color,
                  opacity: layer.opacity,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
