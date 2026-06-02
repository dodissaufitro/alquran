import type { CmsSectionKey, LearningArticlePayload, LearningCategoryMeta } from '../../services/cmsApi'
import { CategoryListEditor } from './editors/CategoryListEditor'
import { DuaListEditor } from './editors/DuaListEditor'
import { HadithListEditor } from './editors/HadithListEditor'
import { JurnalEditor, UlumulEditor } from './editors/JurnalEditor'
import { LearningEditor } from './editors/LearningEditor'
import { PodcastEditor } from './editors/PodcastEditor'
import { PublicMeetingEditor } from './editors/PublicMeetingEditor'
import { ScheduledMeetingEditor } from './editors/ScheduledMeetingEditor'
import { SettingsEditor } from './editors/SettingsEditor'
import { TalaqqiEditor } from './editors/TalaqqiEditor'

type Props = {
  section: CmsSectionKey
  payload: unknown
  saving: boolean
  onSave: (next: unknown) => Promise<void>
  onUpsertArticle?: (
    categoryId: string,
    article: LearningArticlePayload,
    sortOrder: number,
    category: LearningCategoryMeta,
    previousArticleId?: string,
  ) => Promise<void>
  onDeleteArticle?: (articleId: string) => Promise<void>
}

export function SectionEditor({
  section,
  payload,
  saving,
  onSave,
  onUpsertArticle,
  onDeleteArticle,
}: Props) {
  switch (section) {
    case 'learning':
      return (
        <LearningEditor
          categories={payload}
          saving={saving}
          onSave={onSave}
          onUpsertArticle={onUpsertArticle}
          onDeleteArticle={onDeleteArticle}
        />
      )
    case 'jurnal':
      return (
        <JurnalEditor
          data={payload}
          saving={saving}
          onSave={onSave}
          onUpsertArticle={onUpsertArticle}
          onDeleteArticle={onDeleteArticle}
        />
      )
    case 'ulumul':
      return (
        <UlumulEditor
          data={payload}
          saving={saving}
          onSave={onSave}
          onUpsertArticle={onUpsertArticle}
          onDeleteArticle={onDeleteArticle}
        />
      )
    case 'hadithCategories':
      return (
        <CategoryListEditor title="Kategori Hadits" items={payload} saving={saving} onSave={onSave} />
      )
    case 'hadiths':
      return <HadithListEditor items={payload} saving={saving} onSave={onSave} />
    case 'duaCategories':
      return <CategoryListEditor title="Kategori Doa" items={payload} saving={saving} onSave={onSave} />
    case 'duas':
      return <DuaListEditor items={payload} saving={saving} onSave={onSave} />
    case 'podcasts':
      return <PodcastEditor items={payload} saving={saving} onSave={onSave} />
    case 'publicMeetings':
      return <PublicMeetingEditor items={payload} saving={saving} onSave={onSave} />
    case 'scheduledMeetings':
      return <ScheduledMeetingEditor items={payload} saving={saving} onSave={onSave} />
    case 'talaqqi':
      return <TalaqqiEditor data={payload} saving={saving} onSave={onSave} />
    case 'settings':
      return <SettingsEditor data={payload} saving={saving} onSave={onSave} />
    default:
      return <p className="cms-muted">Section tidak dikenali.</p>
  }
}
