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
          <div className="onboarding-icon-wrap">
            <img src={images.logo} alt="" aria-hidden />
          </div>
          <h1>Assalamu&apos;alaikum!</h1>

          <div className="onboarding-language">
            <h2 className="onboarding-language-title">{t.chooseLanguage}</h2>
            <p className="onboarding-language-hint">{t.chooseLanguageHint}</p>
            <LanguagePicker value={selected} onChange={setSelected} onboarding />
          </div>
        </div>

        <div className="onboarding-footer">
          <button type="button" className="btn-primary btn-primary--onboarding" onClick={handleStart}>
            {t.getStarted}
          </button>
        </div>
      </div>
    </div>
  )
}
