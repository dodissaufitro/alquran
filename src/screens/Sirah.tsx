import { useCallback, useState } from 'react'
import {
  getSirahText,
  isSirahFullStory,
  SIRAH_FULL_STORY_ID,
  type SirahCategoryId,
} from '../data/sirah'
import { getSirahFullStory } from '../data/sirahFullStory'
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
  | { type: 'list'; categoryId: SirahCategoryId }
  | { type: 'detail'; sirahId: string }

const CATEGORY_ICON: Record<SirahCategoryId, string> = {
  kelahiran: '🌟',
  dakwah: '📿',
  hijrah: '🐪',
  perang: '⚔️',
  akhir: '🕊️',
}

type Props = {
  onBack: () => void
}

export function Sirah({ onBack }: Props) {
  const { language, t } = useLanguage()
  const { sirahCategories, sirahItems } = useCms()
  const getItem = useCallback((id: string) => sirahItems.find((s) => s.id === id), [sirahItems])
  const getCategory = useCallback(
    (id: SirahCategoryId) => sirahCategories.find((c) => c.id === id),
    [sirahCategories],
  )
  const getItemsByCategory = useCallback(
    (categoryId: SirahCategoryId) => sirahItems.filter((s) => s.categoryId === categoryId),
    [sirahItems],
  )
  const [view, setView] = useState<View>({ type: 'hub' })
  const [copied, setCopied] = useState(false)

  const goHub = () => setView({ type: 'hub' })
  const goList = (categoryId: SirahCategoryId) => setView({ type: 'list', categoryId })
  const goDetail = (sirahId: string) => {
    setCopied(false)
    setView({ type: 'detail', sirahId })
  }

  const handleBack = useCallback(() => {
    if (view.type === 'detail') {
      if (isSirahFullStory(view.sirahId)) {
        goHub()
        return
      }
      const item = getItem(view.sirahId)
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
    const item = getItem(view.sirahId)
    if (!item) {
      goHub()
      return null
    }

    if (isSirahFullStory(item.id)) {
      const sections = getSirahFullStory(language)
      const summary = getSirahText(item.summary, language)
      const copyPayload = [
        item.title,
        item.yearLabel,
        ...sections.map((s) => `${s.title}\n\n${s.body}`),
        item.source,
      ].join('\n\n')

      return (
        <LearnScreen className="sirah-screen sirah-screen--ref sirah-screen--full">
          <LearnHero
            onBack={handleBack}
            breadcrumb={t.sirahTitle}
            title={item.title}
            badge={item.yearLabel}
            compact
          />
          <LearnBody>
            <LearnContentCard>
              <div className="sirah-detail-toolbar">
                <button type="button" className="sirah-copy-btn" onClick={() => copyText(copyPayload)}>
                  <IconCopy />
                  {copied ? t.sirahCopied : t.sirahCopy}
                </button>
              </div>

              {summary ? <p className="sirah-summary-lead">{summary}</p> : null}

              {sections.map((section) => (
                <section key={section.title} className="sirah-full-chapter">
                  <h3 className="sirah-chapter-title">{section.title}</h3>
                  {section.body.split('\n\n').map((para, i) => (
                    <LearnPara key={i}>{para}</LearnPara>
                  ))}
                </section>
              ))}

              <dl className="sirah-meta-block">
                <div>
                  <dt>{t.sirahSource}</dt>
                  <dd>{item.source}</dd>
                </div>
              </dl>

              <p className="sirah-trust-note">{t.sirahTrustNote}</p>
            </LearnContentCard>
          </LearnBody>
        </LearnScreen>
      )
    }

    const category = getCategory(item.categoryId)
    const summary = getSirahText(item.summary, language)
    const content = getSirahText(item.content, language)
    const copyPayload = [item.title, item.yearLabel, content, item.source].filter(Boolean).join('\n\n')

    return (
      <LearnScreen className="sirah-screen sirah-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={category?.title}
          title={item.title}
          badge={item.yearLabel}
          compact
        />
        <LearnBody>
          <LearnContentCard>
            <div className="sirah-detail-toolbar">
              <button type="button" className="sirah-copy-btn" onClick={() => copyText(copyPayload)}>
                <IconCopy />
                {copied ? t.sirahCopied : t.sirahCopy}
              </button>
            </div>

            {summary ? <p className="sirah-summary-lead">{summary}</p> : null}

            {content.split('\n\n').map((para, i) => (
              <LearnPara key={i}>{para}</LearnPara>
            ))}

            <dl className="sirah-meta-block">
              <div>
                <dt>{t.sirahSource}</dt>
                <dd>{item.source}</dd>
              </div>
            </dl>

            <p className="sirah-trust-note">{t.sirahTrustNote}</p>
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
      <LearnScreen className="sirah-screen sirah-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={t.sirahTitle}
          title={category.title}
          description={category.description}
          compact
        />
        <LearnBody>
          <LearnCardList>
            {items.map((item, index) => {
              const summary = getSirahText(item.summary, language)
              return (
                <LearnCardItem key={item.id}>
                  <LearnCard
                    index={index + 1}
                    onClick={() => goDetail(item.id)}
                    title={item.title}
                    summary={summary.length > 88 ? `${summary.slice(0, 88)}…` : summary}
                    meta={item.source}
                    tag={item.yearLabel}
                    accentId="sirah-item"
                  />
                </LearnCardItem>
              )
            })}
          </LearnCardList>
        </LearnBody>
      </LearnScreen>
    )
  }

  const fullStoryItem = getItem(SIRAH_FULL_STORY_ID)

  return (
    <LearnScreen className="sirah-screen sirah-screen--ref">
      <LearnHero onBack={onBack} title={t.sirahTitle} subtitle={t.sirahSubtitle} description={t.sirahIntro} />
      <LearnBody>
        {fullStoryItem ? (
          <>
            <LearnSectionLabel>{t.sirahFullStoryLabel}</LearnSectionLabel>
            <LearnCardList>
              <LearnCardItem>
                <LearnCard
                  onClick={() => goDetail(SIRAH_FULL_STORY_ID)}
                  title={fullStoryItem.title}
                  summary={getSirahText(fullStoryItem.summary, language)}
                  meta={fullStoryItem.yearLabel}
                  icon="📖"
                  accentId="sirah-full"
                />
              </LearnCardItem>
            </LearnCardList>
          </>
        ) : null}
        <LearnSectionLabel>{t.sirahCategoriesLabel}</LearnSectionLabel>
        <LearnCardList>
          {sirahCategories.map((cat) => {
            const count = getItemsByCategory(cat.id).length
            return (
              <LearnCardItem key={cat.id}>
                <LearnCard
                  onClick={() => goList(cat.id)}
                  title={cat.title}
                  summary={cat.description}
                  meta={`${count} ${t.sirahCount}`}
                  icon={CATEGORY_ICON[cat.id]}
                  accentId="sirah"
                />
              </LearnCardItem>
            )
          })}
        </LearnCardList>
      </LearnBody>
    </LearnScreen>
  )
}
