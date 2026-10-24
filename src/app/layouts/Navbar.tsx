import { Link, NavLink } from "react-router"

import { StatusIndicator } from "@/shared/components/feedback/StatusIndicator"
import { cn } from "@/shared/lib/utils"
import type { FeatureRoute } from "@/shared/types/route.types"
import { appConfig } from "../config"
import { ThemeToggle } from "./ThemeToggle"

interface NavbarProps {
  /** Discovered routes that asked for a nav link. */
  navRoutes: FeatureRoute[]
}

export const Navbar = ({ navRoutes }: NavbarProps) => {
  const links = [...navRoutes].sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0))

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center">
            {/* Decorative: the app name is already in the adjacent text. */}
            <img src="/icon.png" alt="" />
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-lg leading-tight">{appConfig.name}</h1>
            <p className="text-[10px] md:text-xs">v{appConfig.version}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {links.length > 1 && (
            <nav aria-label="Navigasi utama" className="flex items-center gap-1">
              {links.map(r => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  end
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent",
                      isActive && "bg-accent font-medium"
                    )
                  }
                >
                  {r.nav?.label}
                </NavLink>
              ))}
            </nav>
          )}
          <StatusIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
