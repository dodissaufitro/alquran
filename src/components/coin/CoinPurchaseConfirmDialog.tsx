import { useLanguage } from '../../context/LanguageContext'
import { formatCoins } from '../../services/coinApi'

type Props = {
  itemTitle: string
  cost: number
  balance: number
  onConfirm: () => void
  onCancel: () => void
}

export function CoinPurchaseConfirmDialog({
  itemTitle,
  cost,
  balance,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useLanguage()
  const balanceAfter = Math.max(0, balance - cost)

  return (
    <div className="coin-confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="coin-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="coin-confirm-title"
        aria-describedby="coin-confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="coin-confirm-title" className="coin-confirm-title">
          {t.coinConfirmTitle}
        </h2>
        <p id="coin-confirm-desc" className="coin-confirm-desc">
          {t.coinConfirmBody
            .replace('{title}', itemTitle)
            .replace('{cost}', formatCoins(cost))
            .replace('{balanceAfter}', formatCoins(balanceAfter))}
        </p>
        <div className="coin-confirm-actions">
          <button type="button" className="coin-confirm-btn coin-confirm-btn--ghost" onClick={onCancel}>
            {t.coinConfirmCancel}
          </button>
          <button type="button" className="coin-confirm-btn coin-confirm-btn--primary" onClick={onConfirm}>
            {t.coinConfirmProceed}
          </button>
        </div>
      </div>
    </div>
  )
}
