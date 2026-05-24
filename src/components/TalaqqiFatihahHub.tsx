import { talaqqiFatihahDescription, type TalaqqiModeId } from '../data/talaqqiFatihah'
import { useCms } from '../context/CmsContext'
import {
  LearnBody,
  LearnCard,
  LearnCardItem,
  LearnCardList,
  LearnHero,
  LearnNote,
  LearnScreen,
  LearnSectionLabel,
} from './learning/LearningLayout'

type Props = {
  onBack: () => void
  onSelectMode: (modeId: TalaqqiModeId) => void
}

export function TalaqqiFatihahHub({ onBack, onSelectMode }: Props) {
  const { fatihahAyahs, talaqqiModes } = useCms()
  return (
    <LearnScreen>
      <LearnHero
        onBack={onBack}
        badge="7 Ayat · Pembuka Al-Qur'an"
        title="Talaqqi Musyaffahah"
        subtitle="Surah Al-Fatihah"
        description={talaqqiFatihahDescription}
      >
        <div className="talaqqi-ayah-strip" aria-hidden>
          {fatihahAyahs.map((a) => (
            <span key={a.numberInSurah} className="talaqqi-ayah-dot">
              {a.numberInSurah}
            </span>
          ))}
        </div>
      </LearnHero>

      <LearnBody>
        <LearnSectionLabel>Pilih cara belajar</LearnSectionLabel>
        <LearnCardList>
          {talaqqiModes.map((mode, index) => (
            <LearnCardItem key={mode.id}>
              <LearnCard
                index={index + 1}
                accentId={mode.id}
                icon={<span aria-hidden>{mode.icon}</span>}
                tag={mode.tagline}
                title={mode.title}
                summary={mode.summary}
                onClick={() => onSelectMode(mode.id)}
              />
            </LearnCardItem>
          ))}
        </LearnCardList>

        <LearnNote>
          <p>
            <strong>Musyaffahah</strong> berarti saling mendengar bacaan: satu pihak membaca, pihak
            lain mengoreksi makhraj dan mad sebelum lanjut ke ayat berikutnya.
          </p>
        </LearnNote>
      </LearnBody>
    </LearnScreen>
  )
}
