import { useCallback, useEffect, useState } from 'react'
import {
  downloadInvoicePdfBlob,
  listInvoices,
} from '../../lib/adminService.ts'
import { formatCurrency, formatDate } from '../../lib/formatting.ts'
import type { Invoice } from '../../types.ts'

type ClientInvoicesPanelProps = {
  clientId: string
  onNavigateToInvoice: (invoiceId: string) => void
}

function statusLabel(status: Invoice['status']) {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'sent':
      return 'Sent'
    case 'paid':
      return 'Paid'
    case 'cancelled':
      return 'Cancelled'
  }
}

export function ClientInvoicesPanel({
  clientId,
  onNavigateToInvoice,
}: ClientInvoicesPanelProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await listInvoices()
      setInvoices(all.filter((invoice) => invoice.authUserId === clientId))
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to load invoices.',
      )
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleDownload = async (invoice: Invoice) => {
    if (!invoice.pdfPath) {
      setError('This invoice does not have a stored PDF yet.')
      return
    }
    setBusyId(invoice.id)
    setError(null)
    try {
      const blob = await downloadInvoicePdfBlob(invoice.pdfPath)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${invoice.invoiceNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to download PDF.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <article className="detail-card admin-uploads-panel">
      <div className="section-card-heading">
        <div>
          <p className="eyebrow">Invoices</p>
          <h3>Issued to this client</h3>
        </div>
        <button
          className="ghost-button"
          disabled={loading}
          onClick={() => void refresh()}
          type="button"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="loading-panel">Loading invoices...</div>
      ) : invoices.length ? (
        <ul className="admin-uploads-list">
          {invoices.map((invoice) => (
            <li className="admin-uploads-item" key={invoice.id}>
              <div className="admin-uploads-meta">
                <strong>
                  {invoice.invoiceNumber} · {formatCurrency(invoice.totalAmount)}
                </strong>
                <span>
                  Issued {formatDate(invoice.issueDate)} · Due{' '}
                  {formatDate(invoice.dueDate)} · {statusLabel(invoice.status)}
                  {invoice.visibleToClient ? ' · visible in portal' : ''}
                </span>
              </div>
              <div className="admin-stage-actions">
                <button
                  className="ghost-button"
                  onClick={() => onNavigateToInvoice(invoice.id)}
                  type="button"
                >
                  Open
                </button>
                <button
                  className="ghost-button"
                  disabled={busyId === invoice.id || !invoice.pdfPath}
                  onClick={() => void handleDownload(invoice)}
                  type="button"
                >
                  {busyId === invoice.id ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-stage-note">No invoices issued to this client yet.</p>
      )}
    </article>
  )
}
