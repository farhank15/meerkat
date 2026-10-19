// Inline icon set. No icon package: the surface is small and tree-shaking a
// dependency for a dozen glyphs is not worth it.

type IconProps = React.SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const GridIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </Icon>
)

export const ActivityIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.5 8h3l2-4.5 3 9 2-4.5h3" />
  </Icon>
)

export const FolderIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3l1.5 2H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5z" />
  </Icon>
)

export const KeyIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5.5" cy="10.5" r="3" />
    <path d="M7.7 8.3 13 3M11 5l1.5 1.5M9.5 6.5 11 8" />
  </Icon>
)

export const PlugIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 2v3M11 2v3M3.5 5h9v3a4.5 4.5 0 0 1-9 0zM8 12.5V14" />
  </Icon>
)

export const TerminalIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
    <path d="M4 6l2.5 2L4 10M8.5 10.5H12" />
  </Icon>
)

export const BookIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2H7v12H3.5A1.5 1.5 0 0 1 2 12.5zM14 3.5A1.5 1.5 0 0 0 12.5 2H9v12h3.5A1.5 1.5 0 0 0 14 12.5z" />
  </Icon>
)

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
  </Icon>
)

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3v10M3 8h10" />
  </Icon>
)

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 5.5v-1A1.5 1.5 0 0 0 9 3H3.5A1.5 1.5 0 0 0 2 4.5V10a1.5 1.5 0 0 0 1.5 1.5h2" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8.5l3 3 7-7" />
  </Icon>
)

export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 2.5H3.5A1.5 1.5 0 0 0 2 4v8.5A1.5 1.5 0 0 0 3.5 14H12a1.5 1.5 0 0 0 1.5-1.5V10M9.5 2.5H14V7M14 2.5 7.5 9" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Icon>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </Icon>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 6 8 10.5 12.5 6" />
  </Icon>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </Icon>
)

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 8h-11M6.5 4l-4 4 4 4" />
  </Icon>
)

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2 15 14H1zM8 6.5v3.5M8 12h.01" />
  </Icon>
)

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 4.5h11M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M4 4.5l.7 9a1 1 0 0 0 1 1h4.6a1 1 0 0 0 1-1l.7-9" />
  </Icon>
)

export const GithubIcon = (p: IconProps) => (
  <Icon {...p} strokeWidth="0" fill="currentColor">
    <path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.7 1.2 2 .9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0C11.6 3.2 12.3 3.4 12.3 3.4c.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.5.4A8 8 0 0 0 8 0" />
  </Icon>
)

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 4.5h12M2 8h12M2 11.5h12" />
  </Icon>
)

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5 14 14" />
  </Icon>
)

export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 2.5H3.5A1.5 1.5 0 0 0 2 4v8a1.5 1.5 0 0 0 1.5 1.5H6M10.5 11l3-3-3-3M13.5 8H6" />
  </Icon>
)

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 1.5 13.5 3.5v4.2c0 3.2-2.2 5.6-5.5 6.8-3.3-1.2-5.5-3.6-5.5-6.8V3.5z" />
  </Icon>
)
