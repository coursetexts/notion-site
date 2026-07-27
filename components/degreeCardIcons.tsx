import * as React from 'react'

type IconProps = {
  className?: string
}

function MonitorIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='3'
        y='4'
        width='18'
        height='12'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M8 20h8M12 16v4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GraduationCapIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 3L2 8l10 5 10-5-10-5z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M22 8v6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function LeafIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M5 19c8 0 14-6 14-14-8 0-14 6-14 14z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M5 19c2-6 6-10 12-12'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GearIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
      <path
        d='M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function BoltIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M13 2L5 13h6l-1 9 9-12h-6l0-8z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BuildingIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M14 10h5a1 1 0 0 1 1 1v10M4 21h16'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M7 8h2M7 12h2M7 16h2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function FlaskIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M9 3h6M10 3v5.2L5.5 18a2.5 2.5 0 0 0 2.2 3.5h8.6A2.5 2.5 0 0 0 18.5 18L14 8.2V3'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function PlaneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M3 12l18-7-4 14-4-5-4 2v-4l-6 0z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ChipIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='7'
        y='7'
        width='10'
        height='10'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function AtomIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='1.75' fill='currentColor' />
      <ellipse
        cx='12'
        cy='12'
        rx='9'
        ry='3.5'
        stroke='currentColor'
        strokeWidth='2'
      />
      <ellipse
        cx='12'
        cy='12'
        rx='9'
        ry='3.5'
        transform='rotate(60 12 12)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <ellipse
        cx='12'
        cy='12'
        rx='9'
        ry='3.5'
        transform='rotate(120 12 12)'
        stroke='currentColor'
        strokeWidth='2'
      />
    </svg>
  )
}

function SigmaIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M18 5H7l6 7-6 7h11'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M4 19V5M4 19h16'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M8 15v-4M12 15V8M16 15v-7'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 3l8 3v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6l8-3z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function TreeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 21v-6M8 15l4-10 4 10H8z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M7 11l5-7 5 7'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function HeartPulseIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M19.5 7.5a4.5 4.5 0 0 0-7.5-3.3A4.5 4.5 0 0 0 4.5 7.5c0 5.5 7.5 10 7.5 10s3.2-1.9 5.4-4.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M3 12h3l2-3 3 6 2-3h3'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CrossIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function StethoscopeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M6 3v7a6 6 0 0 0 12 0V3'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M4 5h4M16 5h4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <circle cx='18' cy='18' r='3' stroke='currentColor' strokeWidth='2' />
      <path
        d='M18 15v-1a3 3 0 0 0-3-3h-1'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function AppleIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 7c2-3 5-3 5-3s0 3-2 4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M12 21c-4.5 0-7-3.2-7-7.2C5 9.5 8 7 12 7s7 2.5 7 6.8c0 4-2.5 7.2-7 7.2z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ActivityIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M3 12h4l2.5-6L14 18l2.5-6H21'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ToothIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M8 4c-2 0-3.5 1.8-3.5 4 0 2.2 1 4.5 1.5 7 .4 2 1 4.5 2.5 4.5.9 0 1.2-1.2 1.5-2.5.3 1.3.6 2.5 1.5 2.5 1.5 0 2.1-2.5 2.5-4.5.5-2.5 1.5-4.8 1.5-7C17.5 5.8 16 4 14 4c-1.2 0-2 .7-2 1.5S11.2 4 10 4H8z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function PillIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M8.5 3.5l12 12a3.5 3.5 0 0 1-5 5l-12-12a3.5 3.5 0 0 1 5-5z'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M7 9.5l7.5 7.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function PawIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <ellipse cx='12' cy='15.5' rx='4.5' ry='3.5' stroke='currentColor' strokeWidth='2' />
      <circle cx='6.5' cy='9' r='1.8' stroke='currentColor' strokeWidth='2' />
      <circle cx='10' cy='6.5' r='1.8' stroke='currentColor' strokeWidth='2' />
      <circle cx='14' cy='6.5' r='1.8' stroke='currentColor' strokeWidth='2' />
      <circle cx='17.5' cy='9' r='1.8' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <circle cx='12' cy='12' r='2.5' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
}

function EarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M16 18c0 1.5-1.5 3-4 3s-4-1.2-4-3 1-3 1-5V9a5 5 0 0 1 10 0v2a2 2 0 0 1-2 2h-1'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function HandIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M8 11V6a1.5 1.5 0 0 1 3 0v4M11 10V4.5a1.5 1.5 0 0 1 3 0V10M14 10V5.5a1.5 1.5 0 0 1 3 0V14c0 3.5-2.5 6-6 6H9a5 5 0 0 1-5-5v-3a1.5 1.5 0 0 1 3 0v2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='3'
        y='7'
        width='18'
        height='13'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CalculatorIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='5'
        y='3'
        width='14'
        height='18'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function TrendUpIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M4 16l6-6 4 4 6-7'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M15 7h5v5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M3 11v2a2 2 0 0 0 2 2h2l8 4V5L7 9H5a2 2 0 0 0-2 2z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M7 15v3a2 2 0 0 0 2 2h1'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <circle cx='9' cy='8' r='3' stroke='currentColor' strokeWidth='2' />
      <path
        d='M3.5 19c.8-2.8 3-4.5 5.5-4.5S13.7 16.2 14.5 19'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <circle cx='17' cy='9' r='2.5' stroke='currentColor' strokeWidth='2' />
      <path
        d='M16 14.5c2 .3 3.6 1.6 4.3 3.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function TruckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M3 7h11v10H3V7zM14 10h4l3 3v4h-7v-7z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <circle cx='7.5' cy='17.5' r='1.5' stroke='currentColor' strokeWidth='2' />
      <circle cx='17.5' cy='17.5' r='1.5' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
}

function ScalesIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 3v18M8 21h8M5 8h14'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M5 8l-2.5 5h5L5 8zM19 8l-2.5 5h5L19 8z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LandmarkIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BrainIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M9.5 4.5a3 3 0 0 0-3 3v.2A2.5 2.5 0 0 0 4 10c0 1.2.8 2.2 2 2.5V17a3 3 0 0 0 3 3h1.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M14.5 4.5a3 3 0 0 1 3 3v.2A2.5 2.5 0 0 1 20 10c0 1.2-.8 2.2-2 2.5V17a3 3 0 0 1-3 3H13.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M12 4v16'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function BookIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M4 18.5A2.5 2.5 0 0 1 6.5 16H20'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-5 4v-4H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function NewspaperIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='3'
        y='4'
        width='18'
        height='16'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M7 8h5M7 12h10M7 16h10'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GlobeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
      <path
        d='M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z'
        stroke='currentColor'
        strokeWidth='2'
      />
    </svg>
  )
}

function PaletteIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H13a1.5 1.5 0 0 1 0-3h3A9 9 0 0 0 12 3z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <circle cx='7.5' cy='10' r='1' fill='currentColor' />
      <circle cx='10' cy='7' r='1' fill='currentColor' />
      <circle cx='14' cy='7.5' r='1' fill='currentColor' />
    </svg>
  )
}

function PenToolIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 20l-7-7 9.5-9.5a2.1 2.1 0 0 1 3 3L12 20z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M5 13l-2 8 8-2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function MusicIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M9 18V6l10-2v12'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='7' cy='18' r='2.5' stroke='currentColor' strokeWidth='2' />
      <circle cx='17' cy='16' r='2.5' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
}

function MasksIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M4 9c0-2.5 2.2-4.5 5-4.5S14 6.5 14 9v4c0 1.8-1.8 3.5-5 3.5S4 14.8 4 13V9z'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M10 9c0-2.5 2.2-4.5 5-4.5S20 6.5 20 9v4c0 1.8-1.8 3.5-5 3.5'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M7 11h.01M11 11h.01M14 11h.01M18 11h.01'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function FilmIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='3'
        y='5'
        width='18'
        height='14'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function LightbulbIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M9 18h6M10 21h4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M8 14a5 5 0 1 1 8 0c-.8.9-1.5 1.7-1.5 3h-5c0-1.3-.7-2.1-1.5-3z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ServerIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='3'
        y='4'
        width='18'
        height='6'
        rx='1.5'
        stroke='currentColor'
        strokeWidth='2'
      />
      <rect
        x='3'
        y='14'
        width='18'
        height='6'
        rx='1.5'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M7 7h.01M7 17h.01M11 7h4M11 17h4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function HotelIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M3 21V8l9-5 9 5v13'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M9 21v-6h6v6M9 10h.01M15 10h.01M12 10h.01'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function HeartHandsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M12 20s-7-4.2-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.8 12 20 12 20z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LanguageIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
      <path
        d='M3 12h18M12 3c2.2 2.5 3.3 5.2 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.2-3.3-9S9.8 5.5 12 3z'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M7 7.5h10M7 16.5h10'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ClipboardIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <rect
        x='6'
        y='5'
        width='12'
        height='16'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M9 5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M9 11h6M9 15h4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

type DegreeIconDef = {
  background: string
  Icon: React.ComponentType<IconProps>
}

const DEGREE_ICON_BY_ID: Record<string, DegreeIconDef> = {
  // STEM — undergrad
  'computer-science': { background: '#E8843A', Icon: MonitorIcon },
  'information-technology': { background: '#D97706', Icon: ServerIcon },
  'engineering-general': { background: '#4A8FD4', Icon: GraduationCapIcon },
  'mechanical-engineering': { background: '#5B8DB8', Icon: GearIcon },
  'electrical-engineering': { background: '#E0A100', Icon: BoltIcon },
  'civil-engineering': { background: '#64748B', Icon: BuildingIcon },
  'chemical-engineering': { background: '#0D9488', Icon: FlaskIcon },
  'aerospace-engineering': { background: '#0284C7', Icon: PlaneIcon },
  'industrial-engineering': { background: '#78909C', Icon: GearIcon },
  'computer-engineering': { background: '#E65100', Icon: ChipIcon },
  'biomedical-engineering': { background: '#059669', Icon: HeartPulseIcon },
  mathematics: { background: '#1E5F8A', Icon: SigmaIcon },
  physics: { background: '#1A5276', Icon: AtomIcon },
  chemistry: { background: '#0F766E', Icon: FlaskIcon },
  biology: { background: '#2E7D32', Icon: LeafIcon },
  'environmental-science': { background: '#558B2F', Icon: TreeIcon },

  // STEM — graduate
  'ms-computer-science': { background: '#E8843A', Icon: MonitorIcon },
  'ms-data-science': { background: '#EA580C', Icon: ChartIcon },
  'ms-cybersecurity': { background: '#C2410C', Icon: ShieldIcon },
  'ms-information-sys': { background: '#D97706', Icon: ServerIcon },
  'meng-general': { background: '#4A8FD4', Icon: GraduationCapIcon },
  'ms-mechanical-eng': { background: '#5B8DB8', Icon: GearIcon },
  'ms-electrical-eng': { background: '#E0A100', Icon: BoltIcon },
  'ms-civil-eng': { background: '#64748B', Icon: BuildingIcon },
  'ms-mathematics': { background: '#1E5F8A', Icon: SigmaIcon },
  'ms-statistics': { background: '#2563EB', Icon: ChartIcon },
  'ms-physics': { background: '#1A5276', Icon: AtomIcon },
  'ms-chemistry': { background: '#0F766E', Icon: FlaskIcon },
  'ms-biology': { background: '#2E7D32', Icon: LeafIcon },

  // Health
  'nursing-bsn': { background: '#E11D48', Icon: CrossIcon },
  'health-professions': { background: '#BE123C', Icon: StethoscopeIcon },
  kinesiology: { background: '#DC2626', Icon: ActivityIcon },
  'public-health': { background: '#F43F5E', Icon: UsersIcon },
  'nutrition-dietetics': { background: '#16A34A', Icon: AppleIcon },
  'md-medicine': { background: '#B91C1C', Icon: StethoscopeIcon },
  'do-osteopathic': { background: '#B91C1C', Icon: StethoscopeIcon },
  'dds-dmd-dental': { background: '#0EA5E9', Icon: ToothIcon },
  pharmd: { background: '#0891B2', Icon: PillIcon },
  dvm: { background: '#A16207', Icon: PawIcon },
  'od-optometry': { background: '#0369A1', Icon: EyeIcon },
  dpt: { background: '#DC2626', Icon: ActivityIcon },
  'pa-phys-assistant': { background: '#E11D48', Icon: ClipboardIcon },
  otd: { background: '#DB2777', Icon: HandIcon },
  dnp: { background: '#E11D48', Icon: CrossIcon },
  'msn-nursing': { background: '#E11D48', Icon: CrossIcon },
  'ms-speech-lang-path': { background: '#0E7490', Icon: ChatIcon },
  aud: { background: '#0284C7', Icon: EarIcon },
  mph: { background: '#F43F5E', Icon: UsersIcon },

  // Business / law / governance
  'business-admin': { background: '#2563EB', Icon: BriefcaseIcon },
  mba: { background: '#2563EB', Icon: BriefcaseIcon },
  accounting: { background: '#1D4ED8', Icon: CalculatorIcon },
  'macc-accounting': { background: '#1D4ED8', Icon: CalculatorIcon },
  finance: { background: '#1E40AF', Icon: TrendUpIcon },
  'ms-finance': { background: '#1E40AF', Icon: TrendUpIcon },
  marketing: { background: '#3B82F6', Icon: MegaphoneIcon },
  economics: { background: '#1E3A8A', Icon: ChartIcon },
  'ma-economics': { background: '#1E3A8A', Icon: ChartIcon },
  'hospitality-Management': { background: '#0F766E', Icon: HotelIcon },
  'human-resources': { background: '#475569', Icon: UsersIcon },
  'supply-chain-Management': { background: '#334155', Icon: TruckIcon },
  'political-science': { background: '#1E40AF', Icon: LandmarkIcon },
  'jd-law': { background: '#0F172A', Icon: ScalesIcon },
  mpa: { background: '#1E3A5F', Icon: LandmarkIcon },
  mpp: { background: '#1E3A5F', Icon: LandmarkIcon },

  // Arts / humanities / social
  psychology: { background: '#5B6B8C', Icon: BrainIcon },
  'ma-psychology': { background: '#5B6B8C', Icon: BrainIcon },
  psyd: { background: '#5B6B8C', Icon: BrainIcon },
  'ma-counseling': { background: '#E11D48', Icon: HeartHandsIcon },
  mft: { background: '#E11D48', Icon: HeartHandsIcon },
  sociology: { background: '#64748B', Icon: UsersIcon },
  anthropology: { background: '#78716C', Icon: GlobeIcon },
  'criminal-justice': { background: '#475569', Icon: ShieldIcon },
  'social-work': { background: '#E11D48', Icon: HeartHandsIcon },
  'msw-social-work': { background: '#E11D48', Icon: HeartHandsIcon },
  'education-elementary': { background: '#CA8A04', Icon: AppleIcon },
  med: { background: '#CA8A04', Icon: BookIcon },
  'med-leadership': { background: '#CA8A04', Icon: BookIcon },
  edd: { background: '#A16207', Icon: GraduationCapIcon },
  communications: { background: '#0891B2', Icon: ChatIcon },
  'ma-communications': { background: '#0891B2', Icon: ChatIcon },
  journalism: { background: '#57534E', Icon: NewspaperIcon },
  english: { background: '#78716C', Icon: BookIcon },
  'ma-english': { background: '#78716C', Icon: BookIcon },
  spanish: { background: '#B45309', Icon: LanguageIcon },
  history: { background: '#92400E', Icon: BookIcon },
  'ma-history': { background: '#92400E', Icon: BookIcon },
  philosophy: { background: '#57534E', Icon: LightbulbIcon },
  'religious-studies': { background: '#78716C', Icon: BookIcon },
  'fine-arts': { background: '#DB2777', Icon: PaletteIcon },
  mfa: { background: '#DB2777', Icon: PaletteIcon },
  'graphic-design': { background: '#EC4899', Icon: PenToolIcon },
  architecture: { background: '#57534E', Icon: BuildingIcon },
  'm-arch': { background: '#57534E', Icon: BuildingIcon },
  music: { background: '#B45309', Icon: MusicIcon },
  'mm-music': { background: '#B45309', Icon: MusicIcon },
  theater: { background: '#A16207', Icon: MasksIcon },
  'film-media': { background: '#44403C', Icon: FilmIcon },
  'liberal-arts': { background: '#78716C', Icon: BookIcon },
  'ma-international-rel': { background: '#0369A1', Icon: GlobeIcon },
  mlis: { background: '#78716C', Icon: BookIcon }
}

const FALLBACK_ICON: DegreeIconDef = {
  background: '#64748B',
  Icon: GraduationCapIcon
}

function resolveDegreeIcon(degreeId: string): DegreeIconDef {
  const exact = DEGREE_ICON_BY_ID[degreeId]
  if (exact) return exact

  const id = degreeId.toLowerCase()

  if (id.includes('computer') || id.includes('software')) {
    return { background: '#E8843A', Icon: MonitorIcon }
  }
  if (id.includes('engineer')) {
    return { background: '#4A8FD4', Icon: GearIcon }
  }
  if (id.includes('bio') || id.includes('life')) {
    return { background: '#2E7D32', Icon: LeafIcon }
  }
  if (id.includes('nurs') || id.includes('medic') || id.includes('health')) {
    return { background: '#E11D48', Icon: CrossIcon }
  }
  if (id.includes('business') || id.includes('mba') || id.includes('admin')) {
    return { background: '#2563EB', Icon: BriefcaseIcon }
  }
  if (id.includes('law') || id.includes('legal')) {
    return { background: '#0F172A', Icon: ScalesIcon }
  }
  if (id.includes('psych') || id.includes('counsel')) {
    return { background: '#5B6B8C', Icon: BrainIcon }
  }
  if (id.includes('art') || id.includes('design')) {
    return { background: '#DB2777', Icon: PaletteIcon }
  }
  if (id.includes('edu') || id.includes('teach')) {
    return { background: '#CA8A04', Icon: BookIcon }
  }

  return FALLBACK_ICON
}

export function DegreeCardIcon({
  degreeId,
  className,
  iconClassName
}: {
  degreeId: string
  className?: string
  iconClassName?: string
}) {
  const { background, Icon } = resolveDegreeIcon(degreeId)

  return (
    <span className={className} style={{ background }} aria-hidden='true'>
      <Icon className={iconClassName} />
    </span>
  )
}
