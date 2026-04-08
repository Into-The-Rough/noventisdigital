import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createClient,
  deleteClient,
  getAuthErrorMessage,
  getCurrentAdmin,
  listAdminClients,
  listAuditLogs,
  resetClientPassword,
  signInAdmin,
  signOutAdmin,
  updateClient,
  uploadClientPack,
} from '../lib/adminService'
import { formatDateTime } from '../lib/formatting'
import type {
  AdminClientRecord,
  AdminUser,
  AuditLogRecord,
  CreateClientInput,
} from '../types'

type AdminView = 'overview' | 'clients' | 'documents' | 'audit'
type AuditScopeFilter = 'all' | 'client_portal' | 'admin_console'
type AuditSubjectFilter = 'all' | 'selected'

const defaultCreateForm: CreateClientInput = {
  email: '',
  password: '',
  fullName: '',
  company: '',
  role: 'Client',
}

const adminViews: Array<{
  id: AdminView
  label: string
  title: string
  detail: string
}> = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Operations dashboard',
    detail: 'High-level health, recent movement, and shortcuts.',
  },
  {
    id: 'clients',
    label: 'Clients',
    title: 'Client directory',
    detail: 'Create, edit, reset, and remove portal access.',
  },
  {
    id: 'documents',
    label: 'Documents',
    title: 'Private packs',
    detail: 'Upload and track authenticated client material.',
  },
  {
    id: 'audit',
    label: 'Audit',
    title: 'Activity log',
    detail: 'Portal behaviour and admin changes in one timeline.',
  },
]

function prettifyEventType(value: string) {
  return value.replace(/_/g, ' ')
}

function getAuditScopeLabel(scope: AuditLogRecord['scope']) {
  return scope === 'admin_console' ? 'Admin' : 'Portal'
}

function getClientLastSignInLabel(client: AdminClientRecord) {
  return client.lastSignInAt ? formatDateTime(client.lastSignInAt) : 'No sign-in yet'
}

export function AdminPage() {
  const [booting, setBooting] = useState(true)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [clients, setClients] = useState<AdminClientRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [auditScope, setAuditScope] = useState<AuditScopeFilter>('all')
  const [auditSubjectFilter, setAuditSubjectFilter] =
    useState<AuditSubjectFilter>('all')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginPending, setLoginPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [createPending, setCreatePending] = useState(false)
  const [updatePending, setUpdatePending] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [uploadPending, setUploadPending] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClientInput>({
    ...defaultCreateForm,
  })
  const [editEmail, setEditEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editRole, setEditRole] = useState('')
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [packTitle, setPackTitle] = useState('')
  const [packSummary, setPackSummary] = useState('')
  const [packStatus, setPackStatus] = useState('Awaiting approval')
  const [packValidUntil, setPackValidUntil] = useState('')
  const [packTimeline, setPackTimeline] = useState('TBC')
  const [packNotes, setPackNotes] = useState('')
  const [packAmount, setPackAmount] = useState('0')
  const [packScope, setPackScope] = useState('')
  const [packLabel, setPackLabel] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [packFile, setPackFile] = useState<File | null>(null)

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null,
    [clients, selectedClientId],
  )

  const totalPacks = useMemo(
    () => clients.reduce((sum, client) => sum + client.quoteCount, 0),
    [clients],
  )

  const firstLoginPendingCount = useMemo(
    () => clients.filter((client) => !client.lastSignInAt).length,
    [clients],
  )

  const recentEventCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000

    return auditLogs.filter((log) => {
      const parsed = Date.parse(log.createdAt)
      return Number.isFinite(parsed) && parsed >= cutoff
    }).length
  }, [auditLogs])

  const portalEventCount = useMemo(
    () => auditLogs.filter((log) => log.scope === 'client_portal').length,
    [auditLogs],
  )

  const adminEventCount = useMemo(
    () => auditLogs.filter((log) => log.scope === 'admin_console').length,
    [auditLogs],
  )

  const recentAuditPreview = useMemo(() => auditLogs.slice(0, 6), [auditLogs])

  const clientsAwaitingFirstLogin = useMemo(
    () => clients.filter((client) => !client.lastSignInAt).slice(0, 5),
    [clients],
  )

  const recentlyUpdatedClients = useMemo(() => clients.slice(0, 5), [clients])

  const selectedClientActivity = useMemo(() => {
    if (!selectedClient) {
      return []
    }

    return auditLogs
      .filter(
        (log) =>
          log.subjectUserId === selectedClient.id || log.actorUserId === selectedClient.id,
      )
      .slice(0, 6)
  }, [auditLogs, selectedClient])

  const visibleAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditScope !== 'all' && log.scope !== auditScope) {
        return false
      }

      if (auditSubjectFilter === 'selected' && selectedClient) {
        return (
          log.subjectUserId === selectedClient.id || log.actorUserId === selectedClient.id
        )
      }

      return true
    })
  }, [auditLogs, auditScope, auditSubjectFilter, selectedClient])

  async function refreshDashboardData() {
    setLoadingData(true)

    try {
      const [nextClients, nextAuditLogs] = await Promise.all([
        listAdminClients(),
        listAuditLogs(100),
      ])

      setClients(nextClients)
      setAuditLogs(nextAuditLogs)
      setLocalError(null)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const nextAdmin = await getCurrentAdmin()

        if (!isActive) {
          return
        }

        setAdmin(nextAdmin)

        if (nextAdmin) {
          await refreshDashboardData()
        }
      } catch (error) {
        if (isActive) {
          setLocalError(getAuthErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setBooting(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!selectedClient) {
      setSelectedClientId(null)
      return
    }

    setSelectedClientId((current) =>
      current && clients.some((client) => client.id === current)
        ? current
        : selectedClient.id,
    )
  }, [clients, selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setAuditSubjectFilter('all')
      setEditEmail('')
      setEditName('')
      setEditCompany('')
      setEditRole('')
      setResetPasswordValue('')
      setPackTitle('')
      setPackSummary('')
      setPackStatus('Awaiting approval')
      setPackValidUntil('')
      setPackTimeline('TBC')
      setPackNotes('')
      setPackAmount('0')
      setPackScope('')
      setPackLabel('')
      setPackDescription('')
      setPackFile(null)
      return
    }

    setEditEmail(selectedClient.email)
    setEditName(selectedClient.name)
    setEditCompany(selectedClient.company)
    setEditRole(selectedClient.role)
    setResetPasswordValue('')
    setPackTitle(`${selectedClient.company} proposal pack`)
    setPackSummary(`PDF collateral and project material for ${selectedClient.company}.`)
    setPackStatus('Awaiting approval')
    setPackValidUntil('')
    setPackTimeline('TBC')
    setPackNotes('')
    setPackAmount('0')
    setPackScope('')
    setPackLabel(`${selectedClient.company} proposal pack`)
    setPackDescription(`Private client pack for ${selectedClient.company}.`)
    setPackFile(null)
  }, [selectedClient])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setStatusMessage(null)
    setLoginPending(true)

    try {
      const nextAdmin = await signInAdmin(email, password)
      setAdmin(nextAdmin)
      await refreshDashboardData()
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setLoginPending(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutPending(true)
    setStatusMessage(null)

    try {
      await signOutAdmin()
      setAdmin(null)
      setClients([])
      setAuditLogs([])
      setSelectedClientId(null)
      setActiveView('overview')
      setAuditScope('all')
      setAuditSubjectFilter('all')
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setSignOutPending(false)
    }
  }

  const handleCreateClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setStatusMessage(null)
    setCreatePending(true)

    try {
      const nextClient = await createClient(createForm)
      await refreshDashboardData()
      if (nextClient?.id) {
        setSelectedClientId(nextClient.id)
      }
      setCreateForm({ ...defaultCreateForm })
      setActiveView('clients')
      setStatusMessage(`Created ${nextClient?.email ?? 'client account'}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setCreatePending(false)
    }
  }

  const handleUpdateClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient) {
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setUpdatePending(true)

    try {
      await updateClient({
        userId: selectedClient.id,
        email: editEmail,
        fullName: editName,
        company: editCompany,
        role: editRole,
      })
      await refreshDashboardData()
      setStatusMessage(`Updated ${editEmail}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setUpdatePending(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient) {
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setResetPending(true)

    try {
      await resetClientPassword({
        userId: selectedClient.id,
        password: resetPasswordValue,
      })
      await refreshDashboardData()
      setResetPasswordValue('')
      setStatusMessage(`Password reset for ${selectedClient.email}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setResetPending(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedClient.email}? This removes their login, quotes and stored files.`,
    )

    if (!confirmed) {
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setDeletePending(true)

    try {
      await deleteClient(selectedClient.id)
      await refreshDashboardData()
      setSelectedClientId(null)
      setActiveView('clients')
      setStatusMessage(`Deleted ${selectedClient.email}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setDeletePending(false)
    }
  }

  const handleUploadPack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient || !packFile) {
      setLocalError('Select a client and choose a PDF file first.')
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setUploadPending(true)

    try {
      await uploadClientPack({
        userId: selectedClient.id,
        title: packTitle,
        summary: packSummary,
        status: packStatus,
        validUntil: packValidUntil,
        timeline: packTimeline,
        notes: packNotes,
        totalAmount: Number(packAmount) || 0,
        scope: packScope
          .split(/[\n,]/g)
          .map((entry) => entry.trim())
          .filter(Boolean),
        documentLabel: packLabel,
        documentDescription: packDescription,
        file: packFile,
      })
      await refreshDashboardData()
      setPackFile(null)
      setStatusMessage(`Uploaded a new pack for ${selectedClient.email}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setUploadPending(false)
    }
  }

  const renderActivityFeed = (items: AuditLogRecord[], emptyText: string) => {
    if (!items.length) {
      return <div className="empty-state">{emptyText}</div>
    }

    return (
      <div className="admin-feed-list">
        {items.map((log) => (
          <article className="admin-feed-item" key={log.id}>
            <div className="admin-feed-meta">
              <span className="document-badge">{getAuditScopeLabel(log.scope)}</span>
              <strong>{prettifyEventType(log.eventType)}</strong>
              <span>{formatDateTime(log.createdAt)}</span>
            </div>
            <p className="admin-feed-copy">
              {log.actorEmail ?? log.actorName ?? 'Unknown'}
              {log.subjectEmail ? ` -> ${log.subjectEmail}` : ''}
            </p>
            {log.documentPath ? <p className="admin-feed-copy">{log.documentPath}</p> : null}
          </article>
        ))}
      </div>
    )
  }

  const renderOverviewView = () => (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Overview</p>
          <h1>Control room</h1>
          <p className="admin-stage-note">
            Keep client access, private documents, and portal activity in one place
            without disappearing into raw Supabase tables.
          </p>
        </div>

        <div className="admin-stage-actions">
          <button
            className="ghost-button"
            disabled={loadingData}
            onClick={() => void refreshDashboardData()}
            type="button"
          >
            {loadingData ? 'Refreshing...' : 'Refresh data'}
          </button>
          <button
            className="primary-button"
            onClick={() => setActiveView('clients')}
            type="button"
          >
            Create or manage client
          </button>
        </div>
      </div>

      <div className="admin-metric-grid">
        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Client accounts</span>
          <strong className="admin-metric-value">{clients.length}</strong>
          <p className="admin-metric-note">Portal users with private access.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Private packs</span>
          <strong className="admin-metric-value">{totalPacks}</strong>
          <p className="admin-metric-note">Quotes and collateral in secure storage.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Awaiting first login</span>
          <strong className="admin-metric-value">{firstLoginPendingCount}</strong>
          <p className="admin-metric-note">Accounts that have not signed in yet.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Last 24 hours</span>
          <strong className="admin-metric-value">{recentEventCount}</strong>
          <p className="admin-metric-note">Recorded admin or portal events.</p>
        </article>
      </div>

      <div className="admin-overview-layout">
        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Quick actions</h3>
            <span>{selectedClient ? selectedClient.company : 'No client selected'}</span>
          </div>

          <div className="admin-action-grid">
            <button
              className="admin-action-card"
              onClick={() => setActiveView('clients')}
              type="button"
            >
              <span className="eyebrow">Users</span>
              <strong>Create or edit client logins</strong>
              <p>Provision access, update profiles, and reset credentials.</p>
            </button>

            <button
              className="admin-action-card"
              onClick={() => setActiveView('documents')}
              type="button"
            >
              <span className="eyebrow">Documents</span>
              <strong>Upload private packs</strong>
              <p>Send PDF collateral into private storage for the selected client.</p>
            </button>

            <button
              className="admin-action-card"
              onClick={() => setActiveView('audit')}
              type="button"
            >
              <span className="eyebrow">Audit</span>
              <strong>Review activity</strong>
              <p>See who signed in, opened documents, or changed client data.</p>
            </button>
          </div>
        </article>

        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Latest activity</h3>
            <span>{recentAuditPreview.length}</span>
          </div>
          {renderActivityFeed(recentAuditPreview, 'Audit activity will appear here.')}
        </article>
      </div>

      <div className="admin-overview-split">
        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Needs first sign-in</h3>
            <span>{clientsAwaitingFirstLogin.length}</span>
          </div>

          {clientsAwaitingFirstLogin.length ? (
            <div className="admin-simple-list">
              {clientsAwaitingFirstLogin.map((client) => (
                <button
                  className="admin-simple-list-item"
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id)
                    setActiveView('clients')
                  }}
                  type="button"
                >
                  <span className="admin-simple-list-copy">
                    <strong>{client.company}</strong>
                    <span>
                      {client.name} · {client.email}
                    </span>
                  </span>
                  <span className="document-badge">No sign-in yet</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">No pending first-login accounts.</div>
          )}
        </article>

        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Recently updated clients</h3>
            <span>{recentlyUpdatedClients.length}</span>
          </div>

          {recentlyUpdatedClients.length ? (
            <div className="admin-simple-list">
              {recentlyUpdatedClients.map((client) => (
                <button
                  className="admin-simple-list-item"
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  type="button"
                >
                  <span className="admin-simple-list-copy">
                    <strong>{client.company}</strong>
                    <span>{getClientLastSignInLabel(client)}</span>
                  </span>
                  <span className="document-badge">{client.quoteCount} pack(s)</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">Client accounts will appear here once created.</div>
          )}
        </article>
      </div>
    </div>
  )

  const renderClientsView = () => (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Clients</p>
          <h1>Client directory</h1>
          <p className="admin-stage-note">
            Create accounts, keep profile details accurate, and control access without
            dropping down into the database.
          </p>
        </div>

        <div className="admin-stage-actions">
          {selectedClient ? (
            <button
              className="ghost-button"
              onClick={() => setActiveView('documents')}
              type="button"
            >
              Manage packs
            </button>
          ) : null}
          <button
            className="ghost-button"
            disabled={loadingData}
            onClick={() => void refreshDashboardData()}
            type="button"
          >
            {loadingData ? 'Refreshing...' : 'Refresh data'}
          </button>
        </div>
      </div>

      <div className="admin-stage-grid admin-stage-grid--clients">
        <form className="detail-card admin-create-card" onSubmit={handleCreateClient}>
          <div className="section-card-heading">
            <div>
              <p className="eyebrow">New client</p>
              <h3>Create login</h3>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="input-group">
              <span>Full name</span>
              <input
                className="text-input"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                type="text"
                value={createForm.fullName}
              />
            </label>

            <label className="input-group">
              <span>Company</span>
              <input
                className="text-input"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    company: event.target.value,
                  }))
                }
                type="text"
                value={createForm.company}
              />
            </label>

            <label className="input-group">
              <span>Email</span>
              <input
                className="text-input"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                type="email"
                value={createForm.email}
              />
            </label>

            <label className="input-group">
              <span>Password</span>
              <input
                className="text-input"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                type="text"
                value={createForm.password}
              />
            </label>

            <label className="input-group admin-span-2">
              <span>Role</span>
              <input
                className="text-input"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                type="text"
                value={createForm.role}
              />
            </label>
          </div>

          <button className="primary-button" disabled={createPending} type="submit">
            {createPending ? 'Creating...' : 'Create client'}
          </button>
        </form>

        {selectedClient ? (
          <div className="admin-column-stack">
            <article className="detail-card admin-client-spotlight">
              <div className="section-card-heading">
                <div>
                  <p className="eyebrow">Selected client</p>
                  <h3>{selectedClient.company}</h3>
                </div>

                <div className="admin-stage-actions">
                  <button
                    className="ghost-button"
                    onClick={() => setActiveView('audit')}
                    type="button"
                  >
                    View audit
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => setActiveView('documents')}
                    type="button"
                  >
                    Open documents
                  </button>
                </div>
              </div>

              <div className="quote-meta-grid">
                <div className="meta-tile">
                  <span>Name</span>
                  <strong>{selectedClient.name}</strong>
                </div>
                <div className="meta-tile">
                  <span>Last sign in</span>
                  <strong>{getClientLastSignInLabel(selectedClient)}</strong>
                </div>
                <div className="meta-tile">
                  <span>Pack count</span>
                  <strong>{selectedClient.quoteCount}</strong>
                </div>
              </div>

              {selectedClientActivity.length ? (
                <div className="admin-feed-list">
                  {selectedClientActivity.slice(0, 3).map((log) => (
                    <article className="admin-feed-item" key={log.id}>
                      <div className="admin-feed-meta">
                        <span className="document-badge">
                          {getAuditScopeLabel(log.scope)}
                        </span>
                        <strong>{prettifyEventType(log.eventType)}</strong>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-stage-note">
                  No recorded activity for this client yet.
                </p>
              )}
            </article>

            <form className="detail-card admin-form-card" onSubmit={handleUpdateClient}>
              <div className="section-card-heading">
                <h3>Edit client details</h3>
              </div>

              <div className="admin-form-grid">
                <label className="input-group">
                  <span>Full name</span>
                  <input
                    className="text-input"
                    onChange={(event) => setEditName(event.target.value)}
                    type="text"
                    value={editName}
                  />
                </label>

                <label className="input-group">
                  <span>Company</span>
                  <input
                    className="text-input"
                    onChange={(event) => setEditCompany(event.target.value)}
                    type="text"
                    value={editCompany}
                  />
                </label>

                <label className="input-group">
                  <span>Email</span>
                  <input
                    className="text-input"
                    onChange={(event) => setEditEmail(event.target.value)}
                    type="email"
                    value={editEmail}
                  />
                </label>

                <label className="input-group">
                  <span>Role</span>
                  <input
                    className="text-input"
                    onChange={(event) => setEditRole(event.target.value)}
                    type="text"
                    value={editRole}
                  />
                </label>
              </div>

              <button className="primary-button" disabled={updatePending} type="submit">
                {updatePending ? 'Saving...' : 'Save details'}
              </button>
            </form>

            <div className="admin-secondary-grid">
              <form className="detail-card admin-form-card" onSubmit={handleResetPassword}>
                <div className="section-card-heading">
                  <h3>Reset password</h3>
                </div>

                <div className="admin-inline-form">
                  <label className="input-group admin-inline-field">
                    <span>New password</span>
                    <input
                      className="text-input"
                      onChange={(event) => setResetPasswordValue(event.target.value)}
                      type="text"
                      value={resetPasswordValue}
                    />
                  </label>

                  <button
                    className="ghost-button"
                    disabled={resetPending || !resetPasswordValue}
                    type="submit"
                  >
                    {resetPending ? 'Resetting...' : 'Reset password'}
                  </button>
                </div>
              </form>

              <article className="detail-card admin-danger-card">
                <div className="section-card-heading">
                  <h3>Delete client</h3>
                </div>
                <p className="admin-stage-note">
                  This removes the login, associated quote rows, and stored files for the
                  selected client.
                </p>
                <button
                  className="ghost-button admin-danger-button"
                  disabled={deletePending}
                  onClick={handleDeleteClient}
                  type="button"
                >
                  {deletePending ? 'Deleting...' : 'Delete user'}
                </button>
              </article>
            </div>
          </div>
        ) : (
          <div className="empty-state large">
            Select a client from the left-hand directory to edit their details.
          </div>
        )}
      </div>
    </div>
  )

  const renderDocumentsView = () => (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Documents</p>
          <h1>Private client packs</h1>
          <p className="admin-stage-note">
            Upload PDF material into the private bucket and attach it to the selected
            client without exposing anything through the public site.
          </p>
        </div>

        <div className="admin-stage-actions">
          {selectedClient ? (
            <button
              className="ghost-button"
              onClick={() => setActiveView('clients')}
              type="button"
            >
              Back to client profile
            </button>
          ) : null}
        </div>
      </div>

      {selectedClient ? (
        <div className="admin-stage-grid admin-stage-grid--documents">
          <article className="detail-card">
            <div className="section-card-heading">
              <div>
                <p className="eyebrow">Selected client</p>
                <h3>{selectedClient.company}</h3>
              </div>
              <span className="document-badge">{selectedClient.quoteCount} pack(s)</span>
            </div>

            <p className="admin-stage-note">
              Files uploaded here are stored in private Supabase Storage and are only
              served back to authenticated portal users at runtime.
            </p>

            {selectedClient.packs.length ? (
              <div className="line-item-grid admin-pack-list">
                {selectedClient.packs.map((pack) => (
                  <div className="line-item-card" key={pack.id}>
                    <div>
                      <h4>{pack.title}</h4>
                      <p>{formatDateTime(pack.updatedAt)}</p>
                    </div>
                    <strong>
                      {pack.status} · {pack.documentCount} file(s)
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No packs uploaded for this client yet.</div>
            )}
          </article>

          <form className="detail-card admin-upload-card" onSubmit={handleUploadPack}>
            <div className="section-card-heading">
              <div>
                <p className="eyebrow">New upload</p>
                <h3>Attach a pack</h3>
              </div>
            </div>

            <div className="admin-form-grid">
              <label className="input-group">
                <span>Pack title</span>
                <input
                  className="text-input"
                  onChange={(event) => setPackTitle(event.target.value)}
                  type="text"
                  value={packTitle}
                />
              </label>

              <label className="input-group">
                <span>Status</span>
                <select
                  className="text-input"
                  onChange={(event) => setPackStatus(event.target.value)}
                  value={packStatus}
                >
                  <option>Awaiting approval</option>
                  <option>Draft</option>
                  <option>Approved</option>
                  <option>In delivery</option>
                </select>
              </label>

              <label className="input-group">
                <span>Valid until</span>
                <input
                  className="text-input"
                  onChange={(event) => setPackValidUntil(event.target.value)}
                  type="date"
                  value={packValidUntil}
                />
              </label>

              <label className="input-group">
                <span>Timeline</span>
                <input
                  className="text-input"
                  onChange={(event) => setPackTimeline(event.target.value)}
                  type="text"
                  value={packTimeline}
                />
              </label>

              <label className="input-group">
                <span>Amount</span>
                <input
                  className="text-input"
                  min="0"
                  onChange={(event) => setPackAmount(event.target.value)}
                  step="1"
                  type="number"
                  value={packAmount}
                />
              </label>

              <label className="input-group">
                <span>PDF file</span>
                <input
                  className="text-input"
                  onChange={(event) => setPackFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>

              <label className="input-group admin-span-2">
                <span>Summary</span>
                <textarea
                  className="text-input text-area-input"
                  onChange={(event) => setPackSummary(event.target.value)}
                  rows={4}
                  value={packSummary}
                />
              </label>

              <label className="input-group admin-span-2">
                <span>Notes</span>
                <textarea
                  className="text-input text-area-input"
                  onChange={(event) => setPackNotes(event.target.value)}
                  rows={3}
                  value={packNotes}
                />
              </label>

              <label className="input-group admin-span-2">
                <span>Scope items</span>
                <textarea
                  className="text-input text-area-input"
                  onChange={(event) => setPackScope(event.target.value)}
                  placeholder="One per line or comma separated"
                  rows={3}
                  value={packScope}
                />
              </label>

              <label className="input-group">
                <span>Document label</span>
                <input
                  className="text-input"
                  onChange={(event) => setPackLabel(event.target.value)}
                  type="text"
                  value={packLabel}
                />
              </label>

              <label className="input-group">
                <span>Document description</span>
                <input
                  className="text-input"
                  onChange={(event) => setPackDescription(event.target.value)}
                  type="text"
                  value={packDescription}
                />
              </label>
            </div>

            <button
              className="primary-button"
              disabled={uploadPending || !packFile}
              type="submit"
            >
              {uploadPending ? 'Uploading...' : 'Upload pack'}
            </button>
          </form>
        </div>
      ) : (
        <div className="empty-state large">
          Select a client from the directory before uploading private collateral.
        </div>
      )}
    </div>
  )

  const renderAuditView = () => (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Audit</p>
          <h1>Recorded activity</h1>
          <p className="admin-stage-note">
            Follow portal sign-ins, quote views, document access, and every admin-side
            change from a single timeline.
          </p>
        </div>

        <div className="admin-stage-actions">
          <button
            className="ghost-button"
            disabled={loadingData}
            onClick={() => void refreshDashboardData()}
            type="button"
          >
            {loadingData ? 'Refreshing...' : 'Refresh data'}
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-group">
          <button
            className={`admin-filter-button ${auditScope === 'all' ? 'is-active' : ''}`}
            onClick={() => setAuditScope('all')}
            type="button"
          >
            All activity
          </button>
          <button
            className={`admin-filter-button ${
              auditScope === 'client_portal' ? 'is-active' : ''
            }`}
            onClick={() => setAuditScope('client_portal')}
            type="button"
          >
            Portal only
          </button>
          <button
            className={`admin-filter-button ${
              auditScope === 'admin_console' ? 'is-active' : ''
            }`}
            onClick={() => setAuditScope('admin_console')}
            type="button"
          >
            Admin only
          </button>
        </div>

        {selectedClient ? (
          <div className="admin-filter-group">
            <button
              className={`admin-filter-button ${
                auditSubjectFilter === 'all' ? 'is-active' : ''
              }`}
              onClick={() => setAuditSubjectFilter('all')}
              type="button"
            >
              All subjects
            </button>
            <button
              className={`admin-filter-button ${
                auditSubjectFilter === 'selected' ? 'is-active' : ''
              }`}
              onClick={() => setAuditSubjectFilter('selected')}
              type="button"
            >
              {selectedClient.company}
            </button>
          </div>
        ) : null}
      </div>

      <div className="admin-audit-summary">
        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Portal events</span>
          <strong className="admin-metric-value">{portalEventCount}</strong>
          <p className="admin-metric-note">Client-side sign-ins and document activity.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Admin events</span>
          <strong className="admin-metric-value">{adminEventCount}</strong>
          <p className="admin-metric-note">Creates, updates, resets, uploads, and deletions.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Visible timeline</span>
          <strong className="admin-metric-value">{visibleAuditLogs.length}</strong>
          <p className="admin-metric-note">
            After the current scope and subject filters are applied.
          </p>
        </article>
      </div>

      <article className="detail-card admin-audit-feed-card">
        <div className="section-card-heading">
          <h3>Audit timeline</h3>
          <span>{visibleAuditLogs.length}</span>
        </div>

        {visibleAuditLogs.length ? (
          <div className="admin-audit-list">
            {visibleAuditLogs.map((log) => (
              <div className="admin-audit-item" key={log.id}>
                <div className="admin-audit-meta">
                  <span className="document-badge">{getAuditScopeLabel(log.scope)}</span>
                  <strong>{prettifyEventType(log.eventType)}</strong>
                  <span>{formatDateTime(log.createdAt)}</span>
                </div>

                <div className="admin-audit-details">
                  <p>
                    Actor: {log.actorEmail ?? log.actorName ?? 'Unknown'}
                    {log.subjectEmail ? ` -> ${log.subjectEmail}` : ''}
                  </p>
                  {log.route ? <p>Route: {log.route}</p> : null}
                  {log.documentPath ? <p>Document: {log.documentPath}</p> : null}
                  {log.quoteId ? <p>Quote: {log.quoteId}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No audit events match the current filters.</div>
        )}
      </article>
    </div>
  )

  if (booting) {
    return (
      <div className="portal-shell">
        <main className="container admin-main-shell">
          <div className="loading-panel">Checking admin session...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="portal-shell">
      <header className="portal-header container">
        <Link className="brand-lockup" to="/">
          <span aria-hidden="true" className="brand-mark" />
          <span className="brand-copy">
            <strong>NOVENTIS</strong>
            <span>Admin console</span>
          </span>
        </Link>

        <div className="portal-header-actions">
          <span className="mode-badge">Admin console</span>
          <Link className="ghost-button" to="/">
            Back to site
          </Link>
          {admin ? (
            <button
              className="ghost-button"
              disabled={signOutPending}
              onClick={handleSignOut}
              type="button"
            >
              {signOutPending ? 'Signing out...' : 'Sign out'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="container admin-main-shell">
        {!admin ? (
          <section className="portal-login-grid portal-login-grid--kinetic">
            <div className="portal-login-copy">
              <p className="eyebrow">Private admin access</p>
              <h1>Client accounts, private packs, audit visibility.</h1>
              <p>
                The admin console controls portal users, passwords, document uploads,
                and the live audit trail behind the client area.
              </p>
            </div>

            <div className="portal-login-card portal-login-card--kinetic">
              <div className="login-card-heading">
                <p className="eyebrow">Admin sign in</p>
                <h2>Open the console</h2>
              </div>

              {localError ? <div className="error-banner">{localError}</div> : null}

              <form className="login-form" onSubmit={handleLogin}>
                <label className="input-group">
                  <span>Email address</span>
                  <input
                    autoComplete="email"
                    className="text-input"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@noventisdigital.co.uk"
                    type="email"
                    value={email}
                  />
                </label>

                <label className="input-group">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    className="text-input"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                    value={password}
                  />
                </label>

                <button
                  className="primary-button full-width-button"
                  disabled={loginPending}
                  type="submit"
                >
                  {loginPending ? 'Signing in...' : 'Sign in to admin'}
                </button>
              </form>
            </div>

            <div className="portal-value-list">
              <article className="benefit-card benefit-card--kinetic">
                <h3>Client account management</h3>
                <p>Create, edit, reset and remove portal users without manual SQL work.</p>
              </article>
              <article className="benefit-card benefit-card--kinetic">
                <h3>Private pack uploads</h3>
                <p>PDF collateral is stored in the private bucket instead of the public site.</p>
              </article>
              <article className="benefit-card benefit-card--kinetic">
                <h3>Audit visibility</h3>
                <p>Recent portal sign-ins, quote views, document opens and admin changes.</p>
              </article>
            </div>
          </section>
        ) : (
          <section className="admin-console">
            <aside className="admin-rail">
              <article className="detail-card admin-session-card">
                <p className="eyebrow">Admin session</p>
                <div className="admin-session-meta">
                  <h1>{admin.name}</h1>
                  <p>{admin.email}</p>
                </div>
              </article>

              <article className="detail-card">
                <p className="eyebrow">Workspace</p>
                <div className="admin-view-nav">
                  {adminViews.map((view) => (
                    <button
                      className={`admin-view-button ${
                        activeView === view.id ? 'is-active' : ''
                      }`}
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      type="button"
                    >
                      <strong>{view.label}</strong>
                      <span>{view.detail}</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="detail-card admin-current-client-card">
                <p className="eyebrow">Current client</p>
                {selectedClient ? (
                  <>
                    <div className="admin-client-context">
                      <h3>{selectedClient.company}</h3>
                      <p>
                        {selectedClient.name} · {selectedClient.role}
                      </p>
                      <p>{selectedClient.email}</p>
                    </div>

                    <div className="admin-rail-actions">
                      <button
                        className="ghost-button"
                        onClick={() => setActiveView('clients')}
                        type="button"
                      >
                        Edit account
                      </button>
                      <button
                        className="ghost-button"
                        onClick={() => setActiveView('documents')}
                        type="button"
                      >
                        Manage packs
                      </button>
                    </div>
                  </>
                ) : (
                  <p>Select a client from the directory to start editing.</p>
                )}
              </article>

              <div className="list-card admin-directory-card">
                <div className="list-card-heading">
                  <h3>Client directory</h3>
                  <span>{loadingData ? '...' : clients.length}</span>
                </div>

                {loadingData ? (
                  <div className="loading-panel">Refreshing admin data...</div>
                ) : clients.length ? (
                  <div className="quote-list">
                    {clients.map((client) => (
                      <button
                        className={`quote-list-item ${
                          client.id === selectedClient?.id ? 'is-active' : ''
                        }`}
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        type="button"
                      >
                        <span className="quote-list-topline">
                          <span className="quote-list-title">{client.company}</span>
                          <span className="status-pill is-amber">{client.quoteCount} pack(s)</span>
                        </span>
                        <span className="quote-list-meta">
                          <strong>{client.name}</strong>
                          <span>{getClientLastSignInLabel(client)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No client accounts exist yet.</div>
                )}
              </div>
            </aside>

            <div className="admin-stage">
              {localError ? <div className="error-banner">{localError}</div> : null}
              {statusMessage ? <div className="notice-banner">{statusMessage}</div> : null}

              {activeView === 'overview' ? renderOverviewView() : null}
              {activeView === 'clients' ? renderClientsView() : null}
              {activeView === 'documents' ? renderDocumentsView() : null}
              {activeView === 'audit' ? renderAuditView() : null}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
