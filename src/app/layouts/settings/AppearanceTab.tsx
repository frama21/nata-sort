import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/utils"
import { useTheme } from "../../providers"

interface Option<T extends string> {
  value: T
  label: string
}

// Language names are shown in their own language so they stay recognizable after a wrong switch.
const LANGUAGES: Option<"en" | "id">[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" }
]

const Segmented = <T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="inline-flex rounded-md border border-border bg-surface p-0.5"
  >
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={o.value === value}
        onClick={() => onChange(o.value)}
        className={cn(
          "rounded-md px-3 py-1 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color] duration-(--dur-base) ease-(--ease) hover:text-foreground pointer-coarse:py-2",
          o.value === value && "bg-surface-hover text-foreground"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
)

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 first:pt-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    {children}
  </div>
)

/** Theme (light / dark) and UI language. Both persist on their own (localStorage). */
export const AppearanceTab = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const language = i18n.resolvedLanguage === "id" ? "id" : "en"

  return (
    <div>
      <Row label={t("settings.theme")}>
        <Segmented
          label={t("settings.theme")}
          value={theme === "light" ? "light" : "dark"}
          options={[
            { value: "light", label: t("settings.themeLight") },
            { value: "dark", label: t("settings.themeDark") }
          ]}
          onChange={setTheme}
        />
      </Row>
      <Row label={t("settings.language")}>
        <Segmented
          label={t("settings.language")}
          value={language}
          options={LANGUAGES}
          onChange={lng => void i18n.changeLanguage(lng)}
        />
      </Row>
    </div>
  )
}
