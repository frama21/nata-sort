import { useId } from "react"

/**
 * NATA's mark: a photo frame split on a 60° diagonal into two piles ("sorting").
 * Solid fills only, built on a 256-unit canvas. The left half follows
 * `currentColor` (ink on light, paper on dark); the right half is the brand teal.
 */
export const NataMark = ({ className }: { className?: string }) => {
  const clipId = useId()
  return (
    <svg aria-hidden viewBox="0 0 256 256" className={className} focusable="false">
      <clipPath id={clipId}>
        <rect x="24" y="24" width="208" height="208" rx="44" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <polygon points="19.3,-40.2 219.3,306.2 -50,306.2 -50,-40.2" fill="currentColor" />
        <polygon points="36.7,-50.2 236.7,296.2 300,296.2 300,-50.2" className="fill-brand-accent" />
      </g>
    </svg>
  )
}
