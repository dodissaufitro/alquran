import { useCallback, useState } from 'react'
import {
  getFiqhText,
  type FiqhCategoryId,
  type FiqhRuling,
} from '../data/fiqh'
import { useCms } from '../context/CmsContext'
import { IconCopy } from '../components/Icons'
import {
  LearnBody,
  LearnCard,
  LearnCardItem,
  LearnCardList,
  LearnContentCard,
  LearnHero,
  LearnPara,
  LearnScreen,
  LearnSectionLabel,
} from '../components/learning/LearningLayout'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'

type View =
  | { type: 'hub' }
  | { type: 'list'; categoryId: FiqhCategoryId }
  | { type: 'detail'; fiqhId: string }

const CATEGORY_ICON: Record<FiqhCategoryId, string> = {
  taharah: '💧',
  sholat: '🕌',
  puasa: '🌙',
  zakat: '🤲',
  muamalah: '⚖️',
}

type Props = {
  onBack: () => void
}

function rulingLabel(
  ruling: FiqhRuling,
  t: {
    fiqhRulingWajib: string
    fiqhRulingSunnah: string
    fiqhRulingHaram: string
    fiqhRulingMakruh: string
    fiqhRulingMubah: string
  },
): string {
  switch (ruling) {
    case 'wajib':
      return t.fiqhRulingWajib
    case 'sunnah':
      return t.fiqhRulingSunnah
    case 'haram':
      return t.fiqhRulingHaram
    case 'makruh':
      return t.fiqhRulingMakruh
    default:
      return t.fiqhRulingMubah
  }
}

export function Fiqh({ onBack }: Props) {
  const { language, t } = useLanguage()
  const { fiqhCategories, fiqhItems } = useCms()
  const getItem = useCallback((id: string) => fiqhItems.find((f) => f.id === id), [fiqhItems])
  const getCategory = useCallback(
    (id: FiqhCategoryId) => fiqhCategories.find((c) => c.id === id),
    [fiqhCategories],
  )
  const getItemsByCategory = useCallback(
    (categoryId: FiqhCategoryId) => fiqhItems.filter((f) => f.categoryId === categoryId),
    [fiqhItems],
  )
  const [view, setView] = useState<View>({ type: 'hub' })
  const [copied, setCopied] = useState(false)

  const goHub = () => setView({ type: 'hub' })
  const goList = (categoryId: FiqhCategoryId) => setView({ type: 'list', categoryId })
  const goDetail = (fiqhId: string) => {
    setCopied(false)
    setView({ type: 'detail', fiqhId })
  }

  const handleBack = useCallback(() => {
    if (view.type === 'detail') {
      const item = getItem(view.fiqhId)
      if (item) goList(item.categoryId)
      else goHub()
      return
    }
    if (view.type === 'list') {
      goHub()
      return
    }
    onBack()
  }, [view, onBack, getItem])

  useBackHandler(handleBack)

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (view.type === 'detail') {
    const item = getItem(view.fiqhId)
    if (!item) {
      goHub()
      return null
    }
    const category = getCategory(item.categoryId)
    const summary = getFiqhText(item.summary, language)
    const content = getFiqhText(item.content, language)
    const copyPayload = [item.title, content, item.dalil, item.source].filter(Boolean).join('\n\n')

    return (
      <LearnScreen className="fiqh-screen fiqh-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={category?.title}
          title={item.title}
          badge={rulingLabel(item.ruling, t)}
          compact
        />
        <LearnBody>
          <LearnContentCard>
            <div className="fiqh-detail-toolbar">
              <button type="button" className="fiqh-copy-btn" onClick={() => copyText(copyPayload)}>
                <IconCopy />
                {copied ? t.fiqhCopied : t.fiqhCopy}
              </button>
            </div>

            {summary ? <p className="fiqh-summary-lead">{summary}</p> : null}

            {content.split('\n\n').map((para, i) => (
              <LearnPara key={i}>{para}</LearnPara>
            ))}

            {item.dalil ? (
              <p className="fiqh-dalil-block quran-uthmani" dir="rtl" lang="ar">
                {item.dalil}
              </p>
            ) : null}

            <dl className="fiqh-meta-block">
              <div>
                <dt>{t.fiqhSource}</dt>
                <dd>{item.source}</dd>
              </div>
            </dl>

            <p className="fiqh-trust-note">{t.fiqhTrustNote}</p>
          </LearnContentCard>
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'list') {
    const category = getCategory(view.categoryId)
    const items = getItemsByCategory(view.categoryId)
    if (!category) {
      goHub()
      return null
    }

    return (
      <LearnScreen className="fiqh-screen fiqh-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={t.fiqhTitle}
          title={category.title}
          description={category.description}
          compact
        />
        <LearnBody>
          <LearnCardList>
            {items.map((item, index) => {
              const summary = getFiqhText(item.summary, language)
              return (
                <LearnCardItem key={item.id}>
                  <LearnCard
                    index={index + 1}
                    onClick={() => goDetail(item.id)}
                    title={item.title}
                    summary={summary.length > 88 ? `${summary.slice(0, 88)}…` : summary}
                    meta={item.source}
                    tag={rulingLabel(item.ruling, t)}
                    accentId="fiqh-item"
                  />
                </LearnCardItem>
              )
            })}
          </LearnCardList>
        </LearnBody>
      </LearnScreen>
    )
  }

  return (
    <LearnScreen className="fiqh-screen fiqh-screen--ref">
      <LearnHero onBack={onBack} title={t.fiqhTitle} subtitle={t.fiqhSubtitle} description={t.fiqhIntro} />
      <LearnBody>
        <LearnSectionLabel>{t.fiqhCategoriesLabel}</LearnSectionLabel>
        <LearnCardList>
          {fiqhCategories.map((cat) => {
            const count = getItemsByCategory(cat.id).length
            return (
              <LearnCardItem key={cat.id}>
                <LearnCard
                  onClick={() => goList(cat.id)}
                  title={cat.title}
                  summary={cat.description}
                  meta={`${count} ${t.fiqhCount}`}
                  icon={CATEGORY_ICON[cat.id]}
                  accentId="fiqh"
                />
              </LearnCardItem>
            )
          })}
        </LearnCardList>
      </LearnBody>
    </LearnScreen>
  )
}
