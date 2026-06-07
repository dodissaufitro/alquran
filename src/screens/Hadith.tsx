import { useCallback, useState } from 'react'
import { getHadithTranslation, type HadithCategoryId, type HadithGrade } from '../data/hadiths'
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
  | { type: 'list'; categoryId: HadithCategoryId }
  | { type: 'detail'; hadithId: string }

const CATEGORY_ICON: Record<HadithCategoryId, string> = {
  iman: '📿',
  ibadah: '🕌',
  akhlak: '💎',
  keluarga: '👨‍👩‍👧‍👦',
}

type Props = {
  onBack: () => void
}

function gradeLabel(grade: HadithGrade, t: { hadithSahih: string; hadithHasan: string }): string {
  return grade === 'sahih' ? t.hadithSahih : t.hadithHasan
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
      <LearnScreen className="hadith-screen hadith-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={category?.title}
          title={item.title}
          badge={gradeLabel(item.grade, t)}
          compact
        />
        <LearnBody>
          <LearnContentCard>
            <div className="hadith-detail-toolbar">
              <button
                type="button"
                className="hadith-copy-btn"
                onClick={() => copyHadith(copyText)}
              >
                <IconCopy />
                {copied ? t.hadithCopied : t.hadithCopy}
              </button>
            </div>

            <p className="hadith-arabic-block quran-uthmani" dir="rtl" lang="ar">
              {item.arabic}
            </p>
            <LearnPara>{trans}</LearnPara>

            <dl className="hadith-meta-block">
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
          </LearnContentCard>
        </LearnBody>
      </LearnScreen>
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
      <LearnScreen className="hadith-screen hadith-screen--ref">
        <LearnHero
          onBack={handleBack}
          breadcrumb={t.hadithTitle}
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
                  meta={item.source}
                  tag={gradeLabel(item.grade, t)}
                  accentId="hadith-item"
                />
              </LearnCardItem>
            ))}
          </LearnCardList>
        </LearnBody>
      </LearnScreen>
    )
  }

  return (
    <LearnScreen className="hadith-screen hadith-screen--ref">
      <LearnHero onBack={onBack} title={t.hadithTitle} subtitle={t.hadithSubtitle} description={t.hadithIntro} />
      <LearnBody>
        <LearnSectionLabel>{t.hadithCategoriesLabel}</LearnSectionLabel>
        <LearnCardList>
          {hadithCategories.map((cat) => {
            const count = getHadithsByCategory(cat.id).length
            return (
              <LearnCardItem key={cat.id}>
                <LearnCard
                  onClick={() => goList(cat.id)}
                  title={cat.title}
                  summary={cat.description}
                  meta={`${count} ${t.hadithCount}`}
                  icon={CATEGORY_ICON[cat.id]}
                  accentId="hadith"
                />
              </LearnCardItem>
            )
          })}
        </LearnCardList>
      </LearnBody>
    </LearnScreen>
  )
}
