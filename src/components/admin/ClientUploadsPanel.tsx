import { useCallback, useEffect, useState } from 'react'
import {
  downloadClientUploadAsBlob,
  listClientUploadsForUser,
} from '../../lib/adminService.ts'
import { formatDateTime } from '../../lib/formatting.ts'
import type { ClientUpload } from '../../types.ts'

type ClientUploadsPanelProps = {
  clientId: string
}

function formatFileSize(size: number | null) {
  if (size === null || size === undefined) {
    return ''
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function ClientUploadsPanel({ clientId }: ClientUploadsPanelProps) {
  const [uploads, setUploads] = useState<ClientUpload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await listClientUploadsForUser(clientId)
      setUploads(next)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to load client uploads right now.',
      )
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleDownload = async (upload: ClientUpload) => {
    setBusyId(upload.id)
    setError(null)
    try {
      const blob = await downloadClientUploadAsBlob(upload.filePath)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = upload.fileName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to download that file right now.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <article className="detail-card admin-uploads-panel">
      <div className="section-card-heading">
        <div>
          <p className="eyebrow">Client uploads</p>
          <h3>Files sent to you</h3>
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
        <div className="loading-panel">Loading client uploads...</div>
      ) : uploads.length ? (
        <ul className="admin-uploads-list">
          {uploads.map((upload) => (
            <li className="admin-uploads-item" key={upload.id}>
              <div className="admin-uploads-meta">
                <strong>{upload.fileName}</strong>
                <span>
                  {formatDateTime(upload.createdAt)}
                  {upload.fileSize ? ` · ${formatFileSize(upload.fileSize)}` : ''}
                  {upload.contentType ? ` · ${upload.contentType}` : ''}
                </span>
              </div>
              <button
                className="ghost-button"
                disabled={busyId === upload.id}
                onClick={() => void handleDownload(upload)}
                type="button"
              >
                {busyId === upload.id ? 'Downloading...' : 'Download'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-stage-note">
          This client has not uploaded any files yet.
        </p>
      )}
    </article>
  )
}
