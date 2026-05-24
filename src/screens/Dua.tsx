import { useCallback, useState } from 'react'
import {
  getDuaTranslation,
  getDuaWhen,
  type DuaCategoryId,
} from '../data/duas'
import { useCms } from '../context/CmsContext'
import { IconBack, IconCopy } from '../components/Icons'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'

type View =
  | { type: 'hub' }
  | { type: 'list'; categoryId: DuaCategoryId }
  | { type: 'detail'; duaId: string }

type Props = {
  onBack: () => void
}

export function Dua({ onBack }: Props) {
  const { language, t } = useLanguage()
  const { duaCategories, duas } = useCms()
  const getDua = useCallback((id: string) => duas.find((d) => d.id === id), [duas])
  const getDuaCategory = useCallback(
    (id: DuaCategoryId) => duaCategories.find((c) => c.id === id),
    [duaCategories],
  )
  const getDuasByCategory = useCallback(
    (categoryId: DuaCategoryId) => duas.filter((d) => d.categoryId === categoryId),
    [duas],
  )
  const [view, setView] = useState<View>({ type: 'hub' })
  const [copied, setCopied] = useState(false)

  const goHub = () => setView({ type: 'hub' })
  const goList = (categoryId: DuaCategoryId) => setView({ type: 'list', categoryId })
  const goDetail = (duaId: string) => {
    setCopied(false)
    setView({ type: 'detail', duaId })
  }

  const handleBack = useCallback(() => {
    if (view.type === 'detail') {
      const d = getDua(view.duaId)
      if (d) goList(d.categoryId)
      else goHub()
      return
    }
    if (view.type === 'list') {
      goHub()
      return
    }
    onBack()
  }, [view, onBack, getDua])

  useBackHandler(handleBack)

  const copyDua = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (view.type === 'detail') {
    const item = getDua(view.duaId)
    if (!item) {
      goHub()
      return null
    }
    const category = getDuaCategory(item.categoryId)
    const trans = getDuaTranslation(item, language)
    const when = getDuaWhen(item, language)
    const copyText = [item.arabic, item.latin, trans, when, item.source]
      .filter(Boolean)
      .join('\n\n')

    return (
      <div className="screen dua-screen">
        <header className="dua-header">
          <button type="button" className="back-btn" onClick={handleBack} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="dua-header-text">
            <p className="dua-breadcrumb">{category?.title}</p>
            <h1>{item.title}</h1>
            {item.essential && <span className="dua-badge-essential">{t.duaEssential}</span>}
          </div>
        </header>

        <article className="dua-detail">
          <div className="dua-detail-actions">
            <button type="button" className="dua-copy-btn" onClick={() => copyDua(copyText)}>
              <IconCopy />
              {copied ? t.duaCopied : t.duaCopy}
            </button>
          </div>

          {when && (
            <p className="dua-when">
              <strong>{t.duaWhen}:</strong> {when}
            </p>
          )}
          {item.repeat && (
            <p className="dua-repeat">
              <strong>{t.duaRepeat}:</strong> {item.repeat}
            </p>
          )}

          <p className="dua-arabic quran-uthmani" dir="rtl" lang="ar">
            {item.arabic}
          </p>
          {item.latin && <p className="dua-latin">{item.latin}</p>}
          <p className="dua-translation">{trans}</p>

          {item.source && (
            <p className="dua-source">
              <strong>{t.duaSource}:</strong> {item.source}
            </p>
          )}
        </article>
      </div>
    )
  }

  if (view.type === 'list') {
    const category = getDuaCategory(view.categoryId)
    const items = getDuasByCategory(view.categoryId)
    if (!category) {
      goHub()
      return null
    }

    return (
      <div className="screen dua-screen">
        <header className="dua-header">
          <button type="button" className="back-btn" onClick={handleBack} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="dua-header-text">
            <h1>{category.title}</h1>
            <p className="dua-subtitle">{category.description}</p>
          </div>
        </header>

        <ul className="dua-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="dua-list-card" onClick={() => goDetail(item.id)}>
                <span className="dua-card-top">
                  <span className="dua-card-title">{item.title}</span>
                  {item.essential && (
                    <span className="dua-badge-essential dua-badge-essential--sm">
                      {t.duaEssential}
                    </span>
                  )}
                </span>
                <span className="dua-card-preview quran-uthmani" dir="rtl" lang="ar">
                  {item.arabic.length > 60 ? `${item.arabic.slice(0, 60)}…` : item.arabic}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="screen dua-screen">
      <header className="dua-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Kembali">
          <IconBack />
        </button>
        <div className="dua-header-text">
          <h1>{t.duaTitle}</h1>
          <p className="dua-subtitle">{t.duaSubtitle}</p>
        </div>
      </header>

      <p className="dua-intro">{t.duaIntro}</p>

      <ul className="dua-category-list">
        {duaCategories.map((cat) => {
          const count = getDuasByCategory(cat.id).length
          return (
            <li key={cat.id}>
              <button type="button" className="dua-category-card" onClick={() => goList(cat.id)}>
                <span className="dua-category-body">
                  <span className="dua-category-title">{cat.title}</span>
                  <span className="dua-category-desc">{cat.description}</span>
                  <span className="dua-category-meta">
                    {count} {t.duaCount}
                  </span>
                </span>
                <span className="learning-chevron" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

