import { useTranslation } from "react-i18next"

import { NataMark } from "./NataMark"

/**
 * The app's loading screen: the NATA mark over an indeterminate progress bar. `index.html` holds a
 * static copy that shows before any script runs; this one takes over when React renders, so the
 * splash stays on screen without a break. The `.boot*` rules live in `index.html`.
 */
export const BootSplash = () => {
  const { t } = useTranslation()
  return (
    <div className="boot" role="status">
      <NataMark className="boot-mark" />
      <div className="boot-track" aria-hidden>
        <div className="boot-bar" />
      </div>
      <span className="boot-sr">{t("route.loading")}</span>
    </div>
  )
}
