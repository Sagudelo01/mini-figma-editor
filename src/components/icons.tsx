import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export const IconRectangle = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <rect x="4" y="6" width="16" height="12" rx="1.5" />
  </Icon>
)

export const IconCircle = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7.5" />
  </Icon>
)

export const IconText = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M6 7V5.5h12V7M12 5.5v13M9.5 18.5h5" />
  </Icon>
)

export const IconUndo = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-1" />
  </Icon>
)

export const IconRedo = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M15 7l5 5-5 5M20 12H9a5 5 0 0 0 0 10h1" />
  </Icon>
)

export const IconExport = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M12 4v10M8.5 10.5 12 14l3.5-3.5M5 20h14" />
  </Icon>
)

export const IconDuplicate = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <rect x="9" y="9" width="11" height="11" rx="1.6" />
    <path d="M5 15V5.6A.6.6 0 0 1 5.6 5H15" />
  </Icon>
)

export const IconTrash = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" />
  </Icon>
)

export const IconZoomIn = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M11 6v10M6 11h10" />
  </Icon>
)

export const IconZoomOut = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M6 11h10" />
  </Icon>
)

export const IconSun = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)

export const IconMoon = (p: SVGProps<SVGSVGElement>): React.JSX.Element => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </Icon>
)
