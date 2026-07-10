import { KajianCategoryIcon } from './KajianCategoryIcon'
import { shortLearningCategoryTitle } from '../../lib/learningDisplay'
import type { LearningCategory } from '../../data/learningContent'

type Props = {
  items: LearningCategory[]
  onSelect: (category: LearningCategory) => void
  formatTitle?: (title: string) => string
  variant?: 'default' | 'hub' | 'hub-compact' | 'home'
}

export function KajianCategoryGrid({
  items,
  onSelect,
  formatTitle = shortLearningCategoryTitle,
  variant = 'default',
}: Props) {
  if (variant === 'home') {
    const bgClasses = [
      'item-purple',
      'item-pink',
      'item-orange',
      'item-blue',
      'item-green',
      'item-yellow',
      'item-teal',
      'item-indigo',
    ]
    return (
      <div className="home-mod-grid8">
        {items.map((cat, idx) => {
          const bgClass = bgClasses[idx % bgClasses.length]
          return (
            <button
              key={cat.id}
              type="button"
              className="home-mod-grid8__card"
              onClick={() => onSelect(cat)}
            >
              <div className={`home-mod-grid8__icon ${bgClass}`}>
                <KajianCategoryIcon id={cat.id} title={formatTitle(cat.title)} />
              </div>
              <span className="home-mod-grid8__label">{formatTitle(cat.title)}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const variantClass =
    variant === 'hub'
      ? ' kajian-grid-panel--hub'
      : variant === 'hub-compact'
        ? ' kajian-grid-panel--hub-compact'
        : ''

  return (
    <div
      className={`kajian-grid-panel${variantClass} kajian-grid-panel--count-${items.length}`}
    >
      <ul className="kajian-icon-grid">
        {items.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              className={`kajian-icon-item kajian-icon-item--${cat.id}`}
              onClick={() => onSelect(cat)}
            >
              <span className="kajian-icon-well">
                <KajianCategoryIcon id={cat.id} title={formatTitle(cat.title)} />
              </span>
              <span className="kajian-icon-label">{formatTitle(cat.title)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
