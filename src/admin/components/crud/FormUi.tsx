import type { CmsLang, I18nText } from './helpers'
import { CMS_LANGS } from './helpers'

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  dir?: 'rtl' | 'ltr'
  rows?: number
  type?: 'text' | 'number' | 'url'
  placeholder?: string
  readOnly?: boolean
}

export function Field({
  label,
  value,
  onChange,
  dir,
  rows,
  type = 'text',
  placeholder,
  readOnly,
}: FieldProps) {
  const common = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    readOnly,
  }
  return (
    <label className="cms-field">
      <span>{label}</span>
      {rows ? (
        <textarea {...common} rows={rows} dir={dir} />
      ) : (
        <input {...common} type={type} dir={dir} />
      )}
    </label>
  )
}

type SelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function SelectField({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type I18nProps = {
  label: string
  value: I18nText
  onChange: (value: I18nText) => void
  multiline?: boolean
}

const LANG_LABELS: Record<CmsLang, string> = {
  id: 'Indonesia',
  ms: 'Melayu',
  ko: 'Korea',
  uz: 'Uzbek',
}

export function I18nFields({ label, value, onChange, multiline }: I18nProps) {
  return (
    <fieldset className="cms-i18n">
      <legend>{label}</legend>
      {CMS_LANGS.map((lang) => (
        <label key={lang} className="cms-field cms-field--inline">
          <span>{LANG_LABELS[lang]}</span>
          {multiline ? (
            <textarea
              rows={2}
              value={value[lang] ?? ''}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          ) : (
            <input
              value={value[lang] ?? ''}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          )}
        </label>
      ))}
    </fieldset>
  )
}

type SaveBarProps = {
  saving: boolean
  onSave: () => void
  label?: string
}

export function SaveBar({ saving, onSave, label = 'Simpan perubahan' }: SaveBarProps) {
  return (
    <div className="cms-save-bar">
      <button type="button" onClick={onSave} disabled={saving}>
        {saving ? 'Menyimpan…' : label}
      </button>
    </div>
  )
}

type ItemShellProps = {
  title: string
  subtitle?: string
  open?: boolean
  onToggle?: () => void
  onRemove?: () => void
  children: React.ReactNode
}

export function ItemShell({ title, subtitle, open = true, onToggle, onRemove, children }: ItemShellProps) {
  return (
    <article className={`cms-item${open ? ' cms-item--open' : ''}`}>
      <header className="cms-item-head">
        <button type="button" className="cms-item-toggle" onClick={onToggle}>
          <strong>{title}</strong>
          {subtitle ? <span className="cms-muted">{subtitle}</span> : null}
        </button>
        {onRemove ? (
          <button type="button" className="ghost danger cms-item-remove" onClick={onRemove}>
            Hapus
          </button>
        ) : null}
      </header>
      {open ? <div className="cms-item-body">{children}</div> : null}
    </article>
  )
}

type CrudHeadProps = {
  title: string
  addLabel?: string
  onAdd?: () => void
}

export function CrudHead({ title, addLabel, onAdd }: CrudHeadProps) {
  return (
    <div className="cms-crud-head">
      <h2>{title}</h2>
      {addLabel && onAdd ? (
        <button type="button" className="secondary" onClick={onAdd}>
          {addLabel}
        </button>
      ) : null}
    </div>
  )
}

type FormScreenHeaderProps = {
  title: string
  onBack?: () => void
}

export function FormScreenHeader({ title, onBack }: FormScreenHeaderProps) {
  return (
    <div className="cms-form-screen-head">
      {onBack ? (
        <button type="button" className="cms-form-back" onClick={onBack}>
          ← Kembali
        </button>
      ) : null}
      <h2>{title}</h2>
    </div>
  )
}


