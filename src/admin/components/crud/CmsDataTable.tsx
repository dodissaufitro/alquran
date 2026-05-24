import type { ReactNode } from 'react'
import { TablePagination, useTablePagination } from './TablePagination'

export type DataTableColumn<T> = {
  key: string
  header: string
  cell: (item: T, index: number) => ReactNode
  className?: string
}

type Props<T> = {
  items: T[]
  columns: DataTableColumn<T>[]
  emptyMessage: string
  onEdit: (index: number) => void
  onRemove: (index: number) => void
  canRemove?: (item: T, index: number) => boolean
  compact?: boolean
}

export function CmsDataTable<T>({
  items,
  columns,
  emptyMessage,
  onEdit,
  onRemove,
  canRemove,
  compact,
}: Props<T>) {
  const pagination = useTablePagination(items.length)
  const paged = items.slice(pagination.startIndex, pagination.startIndex + pagination.pageSize)
  const colSpan = columns.length + 2

  return (
    <div className="cms-table-wrap">
      <table className={`cms-table${compact ? ' cms-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>#</th>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="cms-table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paged.map((item, i) => {
              const index = pagination.startIndex + i
              const removable = canRemove ? canRemove(item, index) : true
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.cell(item, index)}
                    </td>
                  ))}
                  <td className="cms-table-actions">
                    <button type="button" className="cms-table-btn" onClick={() => onEdit(index)}>
                      Edit
                    </button>
                    {removable ? (
                      <button
                        type="button"
                        className="cms-table-btn cms-table-btn--danger"
                        onClick={() => onRemove(index)}
                      >
                        Hapus
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      <TablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={items.length}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
      />
    </div>
  )
}
