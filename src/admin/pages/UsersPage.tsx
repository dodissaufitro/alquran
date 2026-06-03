import { CrudHead } from '../components/crud/FormUi'
import { DashboardUsersTable } from '../components/dashboard/DashboardUsersTable'

export function UsersPage() {
  return (
    <div className="cms-crud cms-list-page">
      <CrudHead title="Daftar Pengguna" />
      <p className="cms-page-desc">
        Semua akun yang login ke aplikasi (Google OAuth atau email/password).
      </p>
      <section className="cms-table-panel">
        <DashboardUsersTable />
      </section>
    </div>
  )
}
