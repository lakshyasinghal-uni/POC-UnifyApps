import { useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Bot, ClipboardList, FilePlus2, FileUp, LayoutDashboard, List, Menu, X } from 'lucide-react'
import { AGENTS, type AgentKey } from '@/data/solution'
import { APP } from '@/data/app-spec'
import { useAgentDock } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'
import { AgentDock, DockToggle } from './AgentDock'
import { DashboardView } from './Dashboard'
import { AssistantView, FormView, UploadView } from './Pages'
import { QueueView } from './Queue'
import type { PageSpec } from './types'
import { useUserName } from './actions'
import { UaMark } from './ua-mark'
import './kit.css'
// after index.css: the app's palette wins over the builder-generated tokens
import './brand.css'

const ICON = { dashboard: LayoutDashboard, queue: ClipboardList, list: List, form: FilePlus2, upload: FileUp, assistant: Bot }

function View({ page }: { page: PageSpec }) {
  switch (page.type) {
    case 'dashboard':
      return <DashboardView page={page} />
    case 'queue':
    case 'list':
      return <QueueView page={page} />
    case 'form':
      return <FormView page={page} />
    case 'upload':
      return <UploadView page={page} />
    case 'assistant':
      return page.agent in AGENTS ? <AssistantView page={page} agentKey={page.agent as AgentKey} /> : null
  }
}

/**
 * The app: a navigation rail with every page of the plan, the page itself, and the solution's agent
 * docked on the right of every screen. Routes come from the approved plan (`@/data/app-spec`).
 */
export function KitRoutes() {
  return (
    <Routes>
      {APP.pages.map((p) => (
        <Route key={p.route} path={p.route} element={<Shell page={p} />} />
      ))}
      <Route path="*" element={<Shell page={APP.pages[0]} />} />
    </Routes>
  )
}

function Shell({ page }: { page: PageSpec }) {
  const dockOpen = useAgentDock((s) => s.open)
  const [menu, setMenu] = useState(false)
  const user = useUserName()
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh bg-muted/40 text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 motion-reduce:transition-none lg:translate-x-0',
          menu ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <UaMark className="size-7" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight">{APP.title}</p>
            {APP.northStar ? <p className="truncate text-[11.5px] text-muted-foreground">{APP.northStar}</p> : null}
          </div>
          <button type="button" onClick={() => setMenu(false)} aria-label="Close the menu" className="ms-auto inline-flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent lg:hidden">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {APP.pages.map((p) => {
            const Icon = ICON[p.type]
            return (
              <NavLink
                key={p.route}
                to={p.route}
                end={p.route === '/'}
                onClick={() => setMenu(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                  )
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{p.name}</span>
              </NavLink>
            )
          })}
        </nav>
        {user ? <p className="truncate border-t px-4 py-3 text-[12px] text-muted-foreground">Signed in as {user}</p> : null}
      </aside>
      {menu ? <div className="fixed inset-0 z-20 bg-foreground/30 lg:hidden" aria-hidden="true" onClick={() => setMenu(false)} /> : null}

      <div className={cn('transition-[padding] duration-300 motion-reduce:transition-none lg:ps-60', dockOpen && 'xl:pe-[420px]')}>
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/85 px-4 py-2.5 backdrop-blur lg:px-6">
          <button type="button" onClick={() => setMenu(true)} aria-label="Open the menu" className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent lg:hidden">
            <Menu className="size-4" aria-hidden="true" />
          </button>
          <p className="truncate text-[13px] text-muted-foreground">{page.name}</p>
          <div className="ms-auto">
            <DockToggle />
          </div>
        </div>
        <main id="main" key={pathname} className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
          <View page={page} />
        </main>
      </div>
      <AgentDock />
    </div>
  )
}
