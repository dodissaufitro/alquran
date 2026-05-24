import { useLanguage } from '../context/LanguageContext'

const RULES = [
  { class: 'ham_wasl', color: '#aaaaaa' },
  { class: 'madda_normal', color: '#537fff' },
  { class: 'madda_permissible', color: '#4050ff' },
  { class: 'madda_necessary', color: '#000ebc' },
  { class: 'madda_obligatory', color: '#2144c1' },
  { class: 'ghunnah', color: '#ff7e1e' },
  { class: 'ikhafa', color: '#9400a8' },
  { class: 'iqlab', color: '#26bffd' },
  { class: 'idgham_ghunnah', color: '#169777' },
  { class: 'idgham_wo_ghunnah', color: '#169200' },
  { class: 'qalaqah', color: '#dd0008' },
] as const

export function TajweedLegend() {
  const { t } = useLanguage()

  return (
    <details className="tajweed-legend">
      <summary>{t.tajweedLegend}</summary>
      <ul className="tajweed-legend-list">
        {RULES.map((rule) => (
          <li key={rule.class}>
            <span className="tajweed-legend-swatch" style={{ background: rule.color }} aria-hidden />
            <span>
              {t.tajweedRules[rule.class as keyof typeof t.tajweedRules] ?? rule.class}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}
