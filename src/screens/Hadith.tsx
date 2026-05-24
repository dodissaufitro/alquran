import { useCallback, useState } from 'react'
import { getHadithTranslation, type HadithCategoryId } from '../data/hadiths'
import { useCms } from '../context/CmsContext'
import { IconBack, IconCopy } from '../components/Icons'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'

type View =
  | { type: 'hub' }
  | { type: 'list'; categoryId: HadithCategoryId }
  | { type: 'detail'; hadithId: string }

type Props = {
  onBack: () => void
}

export function Hadith({ onBack }: Props) {
  const { language, t } = useLanguage()
  const { hadithCategories, hadiths } = useCms()
  const getHadith = useCallback((id: string) => hadiths.find((h) => h.id === id), [hadiths])
  const getHadithCategory = useCallback(
    (id: HadithCategoryId) => hadithCategories.find((c) => c.id === id),
    [hadithCategories],
  )
  const getHadithsByCategory = useCallback(
    (categoryId: HadithCategoryId) => hadiths.filter((h) => h.categoryId === categoryId),
    [hadiths],
  )
  const [view, setView] = useState<View>({ type: 'hub' })
  const [copied, setCopied] = useState(false)

  const goHub = () => setView({ type: 'hub' })
  const goList = (categoryId: HadithCategoryId) => setView({ type: 'list', categoryId })
  const goDetail = (hadithId: string) => {
    setCopied(false)
    setView({ type: 'detail', hadithId })
  }

  const handleBack = useCallback(() => {
    if (view.type === 'detail') {
      const h = getHadith(view.hadithId)
      if (h) goList(h.categoryId)
      else goHub()
      return
    }
    if (view.type === 'list') {
      goHub()
      return
    }
    onBack()
  }, [view, onBack, getHadith])

  useBackHandler(handleBack)

  const copyHadith = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (view.type === 'detail') {
    const item = getHadith(view.hadithId)
    if (!item) {
      goHub()
      return null
    }
    const category = getHadithCategory(item.categoryId)
    const trans = getHadithTranslation(item, language)
    const copyText = `${item.arabic}\n\n${trans}\n\n— ${item.narrator}\n${item.source}`

    return (
      <div className="screen hadith-screen">
        <header className="hadith-header">
          <button type="button" className="back-btn" onClick={handleBack} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="hadith-header-text">
            <p className="hadith-breadcrumb">{category?.title}</p>
            <h1>{item.title}</h1>
            <span className={`hadith-grade hadith-grade--${item.grade}`}>
              {item.grade === 'sahih' ? t.hadithSahih : t.hadithHasan}
            </span>
          </div>
        </header>

        <article className="hadith-detail">
          <div className="hadith-detail-actions">
            <button
              type="button"
              className="hadith-copy-btn"
              onClick={() => copyHadith(copyText)}
            >
              <IconCopy />
              {copied ? t.hadithCopied : t.hadithCopy}
            </button>
          </div>

          <p className="hadith-arabic quran-uthmani" dir="rtl" lang="ar">
            {item.arabic}
          </p>
          <p className="hadith-translation">{trans}</p>

          <dl className="hadith-meta">
            <div>
              <dt>{t.hadithNarrator}</dt>
              <dd>{item.narrator}</dd>
            </div>
            <div>
              <dt>{t.hadithSource}</dt>
              <dd>{item.source}</dd>
            </div>
          </dl>

          <p className="hadith-trust-note">{t.hadithTrustNote}</p>
        </article>
      </div>
    )
  }

  if (view.type === 'list') {
    const category = getHadithCategory(view.categoryId)
    const items = getHadithsByCategory(view.categoryId)
    if (!category) {
      goHub()
      return null
    }

    return (
      <div className="screen hadith-screen">
        <header className="hadith-header">
          <button type="button" className="back-btn" onClick={handleBack} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="hadith-header-text">
            <h1>{category.title}</h1>
            <p className="hadith-subtitle">{category.description}</p>
          </div>
        </header>

        <ul className="hadith-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="hadith-card" onClick={() => goDetail(item.id)}>
                <span className="hadith-card-top">
                  <span className="hadith-card-title">{item.title}</span>
                  <span className={`hadith-grade hadith-grade--${item.grade}`}>
                    {item.grade === 'sahih' ? t.hadithSahih : t.hadithHasan}
                  </span>
                </span>
                <span className="hadith-card-preview quran-uthmani" dir="rtl" lang="ar">
                  {item.arabic.length > 72 ? `${item.arabic.slice(0, 72)}…` : item.arabic}
                </span>
                <span className="hadith-card-source">{item.source}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="screen hadith-screen">
      <header className="hadith-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Kembali">
          <IconBack />
        </button>
        <div className="hadith-header-text">
          <h1>{t.hadithTitle}</h1>
          <p className="hadith-subtitle">{t.hadithSubtitle}</p>
        </div>
      </header>

      <p className="hadith-intro">{t.hadithIntro}</p>

      <ul className="hadith-category-list">
        {hadithCategories.map((cat) => {
          const count = getHadithsByCategory(cat.id).length
          return (
            <li key={cat.id}>
              <button type="button" className="hadith-category-card" onClick={() => goList(cat.id)}>
                <span className="hadith-category-body">
                  <span className="hadith-category-title">{cat.title}</span>
                  <span className="hadith-category-desc">{cat.description}</span>
                  <span className="hadith-category-meta">
                    {count} {t.hadithCount}
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

