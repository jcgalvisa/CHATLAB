// Íconos SVG reutilizables; heredan color con currentColor y se dimensionan con className.
function Icon({ className, children }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function ChatIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </Icon>
  )
}

export function PlusIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function SearchIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  )
}

export function SidebarIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </Icon>
  )
}

export function ArrowUpIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </Icon>
  )
}
