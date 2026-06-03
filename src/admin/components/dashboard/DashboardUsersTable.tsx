import { useCallback, useEffect, useState } from 'react'
import { cmsAdminFetchUsers } from '../../../services/cmsApi'
import { TablePagination, useTablePagination } from '../crud/TablePagination'

const PAGE_SIZE = 15

function formatDate(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function providerLabel(provider: string): string {
  if (provider === 'google') return 'Google'
  if (provider === 'email') return 'Email'
  return provider || '—'
}

export function DashboardUsersTable() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof cmsAdminFetchUsers>>['items']>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const pagination = useTablePagination(total, PAGE_SIZE)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cmsAdminFetchUsers(pagination.page, PAGE_SIZE, query)
      setItems(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat pengguna')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, query])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    pagination.setPage(1)
    setQuery(search.trim())
  }

  return (
    <div className="cms-dashboard-table">
      <form className="cms-dashboard-search" onSubmit={handleSearch}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari email, nama, username…"
          aria-label="Cari pengguna"
        />
        <button type="submit" className="secondary" disabled={loading}>
          Cari
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => void load()}
          disabled={loading}
          title="Muat ulang"
        >
          ↻
        </button>
      </form>

      {error ? <p className="cms-alert cms-alert--error">{error}</p> : null}

      <div className="cms-table-wrap">
        <table className="cms-table cms-table--compact">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Nama</th>
              <th>Username</th>
              <th>Provider</th>
              <th>Login terakhir</th>
              <th>Daftar</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="cms-table-empty">
                  Memuat…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="cms-table-empty">
                  Belum ada pengguna terdaftar.
                </td>
              </tr>
            ) : (
              items.map((row, i) => (
                <tr key={row.email}>
                  <td>{pagination.startIndex + i + 1}</td>
                  <td>
                    <code className="cms-table-code">{row.email}</code>
                    {row.isSuperAdmin ? (
                      <span className="cms-badge cms-badge--admin" title="Super admin">
                        admin
                      </span>
                    ) : null}
                  </td>
                  <td>{row.name || '—'}</td>
                  <td className="cms-table-muted">{row.username ?? '—'}</td>
                  <td>{providerLabel(row.provider)}</td>
                  <td className="cms-table-muted">{formatDate(row.lastLoginAt)}</td>
                  <td className="cms-table-muted">{formatDate(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination
          page={pagination.page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  )
}
