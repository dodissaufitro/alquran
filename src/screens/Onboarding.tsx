import { useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { LanguagePicker } from '../components/LanguagePicker'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { images } from '../data/images'
import type { AppLanguage } from '../i18n/languages'

type Props = {
  onGetStarted: () => void
}

export function Onboarding({ onGetStarted }: Props) {
  const { language, setLanguage, t } = useLanguage()
  const [selected, setSelected] = useState<AppLanguage>(language)

  const handleStart = () => {
    setLanguage(selected)
    onGetStarted()
  }

  useBackHandler(() => {
    void CapApp.exitApp()
  })

  return (
    <div className="screen onboarding">
      <div className="onboarding-hero">
        <img
          src={images.onboardingMosque}
          alt=""
          className="onboarding-hero-img"
        />
        <div className="onboarding-hero-overlay" aria-hidden />
      </div>

      <div className="onboarding-body">
        <div className="onboarding-scroll">
          <h1>Assalamu&apos;alaikum!</h1>
          <div className="onboarding-divider">
            <span className="divider-line" />
            <span className="divider-pattern">✦</span>
            <span className="divider-line" />
          </div>

          <div className="onboarding-language">
            <h2 className="onboarding-language-title">{t.chooseLanguage}</h2>
            <p className="onboarding-language-hint">{t.chooseLanguageHint}</p>
            <LanguagePicker value={selected} onChange={setSelected} onboarding />
          </div>
        </div>

        <div className="onboarding-footer">
          <button type="button" className="btn-primary btn-primary--onboarding" onClick={handleStart}>
            <span>{t.getStarted}</span>
            <svg
              className="btn-onboarding-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
