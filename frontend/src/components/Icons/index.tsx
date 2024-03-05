// Copied from lucide.
//
// Because the package by lucide tend to make a lot of requests when developing,
// which is vexing. So I just copy those SVG as a component.

const width = '100%';
const height = '100%';
const defaultAttr = {
  width,
  height,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round' as 'round',
  'stroke-linejoin': 'round' as 'round',
}

export function CheckCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...defaultAttr} class="lucide lucide-check-circle">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <path d="m9 11 3 3L22 4"/>
    </svg>
  )
}

export function Circle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...defaultAttr} class="lucide lucide-circle">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  )
}

export function Trash2() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...defaultAttr} class="lucide lucide-trash-2">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  )
}