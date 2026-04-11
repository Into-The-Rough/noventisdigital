import { useMemo, useState } from 'react'
import { sampleTemplates } from '../../lib/emailTemplates.ts'
import type { EmailTemplateId } from '../../lib/emailTemplates.ts'

const FROM_ADDRESS = 'hello@noventisdigital.co.uk'
const SAMPLE_TO = 'stuart.handley@spe.co.uk'

export function EmailPreviewView() {
  const [activeId, setActiveId] = useState<EmailTemplateId>(sampleTemplates[0].id)
  const [mode, setMode] = useState<'html' | 'text'>('html')

  const active = useMemo(
    () => sampleTemplates.find((template) => template.id === activeId) ?? sampleTemplates[0],
    [activeId],
  )

  const rendered = useMemo(() => active.render(), [active])

  return (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Email preview</p>
          <h1>Transactional templates</h1>
          <p className="admin-stage-note">
            Local preview of the email templates. Nothing is sent from here. Sample
            data is fixed so you can see the layout and iterate on copy, then we wire
            the actual sending once the templates are signed off.
          </p>
        </div>
      </div>

      <div className="admin-email-layout">
        <aside className="admin-email-sidebar detail-card">
          <p className="eyebrow">Templates</p>
          <div className="admin-email-template-list">
            {sampleTemplates.map((template) => (
              <button
                className={`admin-email-template-button ${
                  template.id === activeId ? 'is-active' : ''
                }`}
                key={template.id}
                onClick={() => setActiveId(template.id)}
                type="button"
              >
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-email-stage">
          <article className="detail-card admin-email-envelope">
            <div className="admin-email-envelope-row">
              <span>From</span>
              <strong>{FROM_ADDRESS}</strong>
            </div>
            <div className="admin-email-envelope-row">
              <span>To</span>
              <strong>{SAMPLE_TO}</strong>
            </div>
            <div className="admin-email-envelope-row">
              <span>Subject</span>
              <strong>{rendered.subject}</strong>
            </div>
          </article>

          <article className="detail-card admin-email-body-card">
            <div className="section-card-heading">
              <div>
                <p className="eyebrow">Body</p>
                <h3>{mode === 'html' ? 'HTML rendering' : 'Plain text'}</h3>
              </div>
              <div className="admin-email-mode-toggle">
                <button
                  className={`ghost-button ${mode === 'html' ? 'is-active' : ''}`}
                  onClick={() => setMode('html')}
                  type="button"
                >
                  HTML
                </button>
                <button
                  className={`ghost-button ${mode === 'text' ? 'is-active' : ''}`}
                  onClick={() => setMode('text')}
                  type="button"
                >
                  Plain text
                </button>
              </div>
            </div>

            {mode === 'html' ? (
              <div className="admin-email-iframe-wrap">
                <iframe
                  className="admin-email-iframe"
                  sandbox=""
                  srcDoc={rendered.html}
                  title={`${active.label} HTML preview`}
                />
              </div>
            ) : (
              <pre className="admin-email-text">{rendered.text}</pre>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
