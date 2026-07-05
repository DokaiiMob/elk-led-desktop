export type TabId = 'connect' | 'music' | 'effects' | 'manual'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'connect', label: 'Связь' },
  { id: 'music', label: 'Музыка' },
  { id: 'effects', label: 'Эффекты' },
  { id: 'manual', label: 'Цвет' }
]

interface TabNavProps {
  active: TabId
  onChange: (tab: TabId) => void
  disabled?: Partial<Record<TabId, boolean>>
}

export function TabNav({ active, onChange, disabled }: TabNavProps): React.JSX.Element {
  return (
    <nav className="tab-nav" role="tablist" aria-label="Разделы приложения">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-nav__item ${active === tab.id ? 'tab-nav__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
          disabled={disabled?.[tab.id]}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
