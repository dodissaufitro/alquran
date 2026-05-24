import { useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

export function useTablePagination(total: number, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [total])

  const startIndex = (page - 1) * pageSize

  return useMemo(
    () => ({
      page,
      setPage,
      pageSize,
      totalPages,
      startIndex,
      endIndex: Math.min(startIndex + pageSize, total),
      hasPagination: total > pageSize,
    }),
    [page, pageSize, totalPages, startIndex, total],
  )
}

type Props = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function TablePagination({ page, pageSize, total, totalPages, onPageChange }: Props) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <nav className="cms-pagination" aria-label="Navigasi halaman">
      <span className="cms-pagination-info">
        Menampilkan {start}–{end} dari {total}
      </span>
      <div className="cms-pagination-controls">
        <button
          type="button"
          className="cms-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Sebelumnya
        </button>
        <span className="cms-pagination-pages">
          Halaman {page} / {totalPages}
        </span>
        <button
          type="button"
          className="cms-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya →
        </button>
      </div>
    </nav>
  )
}
