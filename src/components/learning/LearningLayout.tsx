import type { ReactNode } from 'react'
import { IconBack } from '../Icons'

type LearnScreenProps = {
  children: ReactNode
  className?: string
  chatLayout?: boolean
}

export function LearnScreen({ children, className = '', chatLayout = false }: LearnScreenProps) {
  const extra = [chatLayout ? 'learn-screen--chat' : '', className].filter(Boolean).join(' ')
  return (
    <div className={`screen learning-screen learn-scroll-screen${extra ? ` ${extra}` : ''}`}>
      {children}
    </div>
  )
}

type LearnHeroProps = {
  onBack: () => void
  title: string
  subtitle?: string
  description?: string
  meta?: string
  breadcrumb?: string
  badge?: string
  icon?: ReactNode
  compact?: boolean
  children?: ReactNode
}

export function LearnHero({
  onBack,
  title,
  subtitle,
  description,
  meta,
  breadcrumb,
  badge,
  icon,
  compact = false,
  children,
}: LearnHeroProps) {
  return (
    <header className={`learn-hero${compact ? ' learn-hero--compact' : ''}`}>
      <button type="button" className="learn-hero-back" onClick={onBack} aria-label="Kembali">
        <IconBack />
      </button>
      <div className="learn-hero-inner">
        {breadcrumb && <p className="learn-hero-breadcrumb">{breadcrumb}</p>}
        {badge && <span className="learn-hero-badge">{badge}</span>}
        {icon && <div className="learn-hero-icon learn-hero-icon--svg">{icon}</div>}
        <h1 className="learn-hero-title">{title}</h1>
        {subtitle && <p className="learn-hero-subtitle">{subtitle}</p>}
        {description && <p className="learn-hero-desc">{description}</p>}
        {meta && <p className="learn-hero-meta">{meta}</p>}
        {children}
      </div>
    </header>
  )
}

export function LearnBody({ children }: { children: ReactNode }) {
  return <div className="learn-body">{children}</div>
}

export function LearnSectionLabel({ children }: { children: ReactNode }) {
  return <p className="learn-section-label">{children}</p>
}

type LearnCardProps = {
  onClick: () => void
  title: string
  summary?: string
  meta?: string
  tag?: string
  index?: number
  icon?: ReactNode
  accentId?: string
}

export function LearnCard({
  onClick,
  title,
  summary,
  meta,
  tag,
  index,
  icon,
  accentId,
}: LearnCardProps) {
  const accent = accentId ? ` learn-card--${accentId}` : ''
  return (
    <button type="button" className={`learn-card${accent}`} onClick={onClick}>
      {index != null && <span className="learn-card-num">{index}</span>}
      {icon && <span className="learn-card-icon">{icon}</span>}
      <span className="learn-card-content">
        {tag && <span className="learn-card-tag">{tag}</span>}
        <span className="learn-card-title">{title}</span>
        {summary && <span className="learn-card-summary">{summary}</span>}
        {meta && <span className="learn-card-meta">{meta}</span>}
      </span>
      <span className="learn-card-arrow" aria-hidden>
        ›
      </span>
    </button>
  )
}

export function LearnCardList({ children }: { children: ReactNode }) {
  return <ul className="learn-card-list">{children}</ul>
}

export function LearnCardItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>
}

export function LearnNote({ children }: { children: ReactNode }) {
  return (
    <aside className="learn-note">
      <span className="learn-note-icon" aria-hidden>
        ✦
      </span>
      <div>{children}</div>
    </aside>
  )
}

export function LearnContentCard({
  summary,
  children,
}: {
  summary?: string
  children: ReactNode
}) {
  return (
    <article className="learn-content-card">
      {summary && <p className="learn-content-summary">{summary}</p>}
      {children}
    </article>
  )
}

export function LearnPara({ children }: { children: ReactNode }) {
  return <p className="learn-para">{children}</p>
}
