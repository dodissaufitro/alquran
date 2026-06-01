import { KajianCategoryIcon } from './KajianCategoryIcon'
import { shortLearningCategoryTitle } from '../../lib/learningDisplay'
import type { LearningCategory } from '../../data/learningContent'

type Props = {
  items: LearningCategory[]
  onSelect: (category: LearningCategory) => void
  formatTitle?: (title: string) => string
  variant?: 'default' | 'hub'
}

export function KajianCategoryGrid({
  items,
  onSelect,
  formatTitle = shortLearningCategoryTitle,
  variant = 'default',
}: Props) {
  return (
    <div className={`kajian-grid-panel${variant === 'hub' ? ' kajian-grid-panel--hub' : ''}`}>
      <ul className="kajian-icon-grid">
        {items.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              className={`kajian-icon-item kajian-icon-item--${cat.id}`}
              onClick={() => onSelect(cat)}
            >
              <span className="kajian-icon-well">
                <KajianCategoryIcon id={cat.id} />
              </span>
              <span className="kajian-icon-label">{formatTitle(cat.title)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
