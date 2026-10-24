import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button"
import { WithTooltip } from "@/shared/components/ui/tooltip"
import { useTheme } from "../providers/ThemeProvider"

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  const { t } = useTranslation()

  const isDarkTheme = theme === "dark"

  const toggleTheme = () => {
    if (isDarkTheme) {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  return (
    <WithTooltip label={t("theme.toggle")}>
      <Button variant="ghost" size="icon" aria-label={t("theme.toggle")} onClick={toggleTheme}>
        {isDarkTheme ? <Moon /> : <Sun />}
        <span className="sr-only">{t("theme.toggle")}</span>
      </Button>
    </WithTooltip>
  )
}
