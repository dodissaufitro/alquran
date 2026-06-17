import { ProfileSubViewShell } from './ProfileSubViewShell'
import {
  PRIVACY_POLICY_UPDATED,
  PRIVACY_POLICY_URL,
  privacyPolicySections,
} from '../../data/privacyPolicyContent'

type Props = {
  onBack: () => void
}

export function ProfilePrivacyPolicy({ onBack }: Props) {
  return (
    <ProfileSubViewShell title="Kebijakan Privasi" onBack={onBack}>
      <p className="profile-privacy-updated">Pembaruan terakhir: {PRIVACY_POLICY_UPDATED}</p>

      <div className="profile-privacy-body">
        {privacyPolicySections.map((section) => (
          <section key={section.id} className="profile-privacy-section" id={section.id}>
            <h2 className="profile-privacy-heading">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="profile-privacy-paragraph">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="profile-privacy-list">
                {section.list.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            )}
            {section.subsections?.map((sub) => (
              <div key={sub.title} className="profile-privacy-subsection">
                <h3 className="profile-privacy-subheading">{sub.title}</h3>
                <ul className="profile-privacy-list">
                  {sub.items.map((item) => (
                    <li key={item.slice(0, 48)}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>

      <p className="profile-privacy-web-link">
        Versi web:{' '}
        <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">
          {PRIVACY_POLICY_URL.replace('https://', '')}
        </a>
      </p>
    </ProfileSubViewShell>
  )
}
