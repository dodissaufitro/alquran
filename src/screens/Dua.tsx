import { useCallback, useState } from 'react'
import {
  getDuaTranslation,
  getDuaWhen,
  type DuaCategoryId,
} from '../data/duas'
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
  | { type: 'list'; categoryId: DuaCategoryId }
  | { type: 'detail'; duaId: string }

const CATEGORY_ICON: Record<DuaCategoryId, string> = {
  wajib: '⭐',
  sholat: '🕌',
  'pagi-petang': '🌅',
  'sehari-hari': '📿',
}

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
      <LearnScreen className="dua-screen dua-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={category?.title}
          title={item.title}
          badge={item.essential ? t.duaEssential : undefined}
          compact
        />
        <LearnBody>
          <LearnContentCard>
            <div className="dua-detail-toolbar">
              <button
                type="button"
                className="dua-copy-btn"
                onClick={() => copyDua(copyText)}
              >
                <IconCopy />
                {copied ? t.duaCopied : t.duaCopy}
              </button>
            </div>

            {when ? (
              <p className="dua-meta-line">
                <strong>{t.duaWhen}:</strong> {when}
              </p>
            ) : null}
            {item.repeat ? (
              <p className="dua-meta-line">
                <strong>{t.duaRepeat}:</strong> {item.repeat}
              </p>
            ) : null}

            <p className="dua-arabic-block quran-uthmani" dir="rtl" lang="ar">
              {item.arabic}
            </p>
            {item.latin ? <p className="dua-latin-block">{item.latin}</p> : null}
            <LearnPara>{trans}</LearnPara>

            {item.source ? (
              <p className="dua-meta-line dua-meta-line--source">
                <strong>{t.duaSource}:</strong> {item.source}
              </p>
            ) : null}
          </LearnContentCard>
        </LearnBody>
      </LearnScreen>
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
      <LearnScreen className="dua-screen dua-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={t.duaTitle}
          title={category.title}
          description={category.description}
          compact
        />
        <LearnBody>
          <LearnCardList>
            {items.map((item, index) => (
              <LearnCardItem key={item.id}>
                <LearnCard
                  index={index + 1}
                  onClick={() => goDetail(item.id)}
                  title={item.title}
                  summary={
                    item.arabic.length > 72 ? `${item.arabic.slice(0, 72)}…` : item.arabic
                  }
                  tag={item.essential ? t.duaEssential : undefined}
                  accentId="dua-item"
                />
              </LearnCardItem>
            ))}
          </LearnCardList>
        </LearnBody>
      </LearnScreen>
    )
  }

  return (
    <LearnScreen className="dua-screen dua-screen--ref">
      <LearnHero onBack={onBack} title={t.duaTitle} subtitle={t.duaSubtitle} description={t.duaIntro} />
      <LearnBody>
        <LearnSectionLabel>{t.duaCategoriesLabel}</LearnSectionLabel>
        <LearnCardList>
          {duaCategories.map((cat) => {
            const count = getDuasByCategory(cat.id).length
            return (
              <LearnCardItem key={cat.id}>
                <LearnCard
                  onClick={() => goList(cat.id)}
                  title={cat.title}
                  summary={cat.description}
                  meta={`${count} ${t.duaCount}`}
                  icon={CATEGORY_ICON[cat.id]}
                  accentId="dua"
                />
              </LearnCardItem>
            )
          })}
        </LearnCardList>
      </LearnBody>
    </LearnScreen>
  )
}
