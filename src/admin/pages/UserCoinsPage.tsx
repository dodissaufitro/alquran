import { CrudHead } from '../components/crud/FormUi'
import { DashboardUserCoinsTable } from '../components/dashboard/DashboardUserCoinsTable'

export function UserCoinsPage() {
  return (
    <div className="cms-crud cms-list-page">
      <CrudHead title="Saldo Coin Pengguna" />
      <p className="cms-page-desc">
        Saldo dompet coin per pengguna, diurutkan dari saldo tertinggi.
      </p>
      <section className="cms-table-panel">
        <DashboardUserCoinsTable />
      </section>
    </div>
  )
}
