import { Link } from 'react-router-dom'

const offers = [
  {
    title: 'AI Strategy And Delivery',
    description:
      'Turn AI opportunities into scoped, testable initiatives with the right workflow design, tooling choices and rollout plan.',
  },
  {
    title: 'Product And Portal Builds',
    description:
      'Ship working software fast, from client portals and internal tools to automation surfaces and revenue-facing MVPs.',
  },
  {
    title: 'Commercial Systems',
    description:
      'Design the operational layer behind growth: quote flows, onboarding journeys, reporting dashboards and service automation.',
  },
]

const principles = [
  {
    step: '01',
    title: 'Find the leverage',
    description:
      'We start with the commercial bottleneck or workflow friction, not a trend-driven AI wishlist.',
  },
  {
    step: '02',
    title: 'Prototype the right thing',
    description:
      'I build fast, but only after the operating model is clear enough to avoid expensive dead ends.',
  },
  {
    step: '03',
    title: 'Ship something usable',
    description:
      'The end state is a tool or system your team and your clients can actually work inside, not just a deck or demo.',
  },
]

const capabilities = [
  'Client portals and quote sharing',
  'AI workflow design and automation',
  'Custom product development',
  'Offer packaging and digital delivery',
]

export function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header container">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark">ND</span>
          <span className="brand-copy">
            <strong>Noventis Digital</strong>
            <span>AI consultancy, product builds and client systems</span>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Primary">
          <a href="#services">Services</a>
          <a href="#portal-preview">Portal</a>
          <a href="#about">About</a>
        </nav>

        <div className="header-actions">
          <a
            className="ghost-button"
            href="https://www.linkedin.com/in/jmbyrne/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <Link className="primary-button" to="/portal">
            Client portal
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section container">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Digital entrepreneur. AI consultant. Developer.</p>
              <h1>Build the system behind the service, not just the pitch.</h1>
              <p className="hero-text">
                I&apos;m John Byrne. I help businesses turn AI and product ideas into
                working software, stronger delivery systems and cleaner client
                experiences.
              </p>

              <div className="hero-actions">
                <a
                  className="primary-button"
                  href="mailto:hello@noventisdigital.co.uk?subject=Project%20enquiry"
                >
                  Start a project
                </a>
                <Link className="ghost-button" to="/portal">
                  View the portal
                </Link>
              </div>

              <div className="hero-metrics" aria-label="Capability highlights">
                {capabilities.map((item) => (
                  <div className="metric-card" key={item}>
                    <span className="metric-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-stack">
              <div className="panel-card signal-card">
                <p className="card-label">What I build</p>
                <h2>AI-native delivery layers for modern service businesses.</h2>
                <p>
                  Systems that connect sales, quoting, delivery and client access
                  without forcing you into bloated enterprise software.
                </p>
              </div>

              <div className="panel-card quote-preview-card">
                <div className="preview-topline">
                  <span className="status-pill is-amber">Awaiting approval</span>
                  <span>Quote preview</span>
                </div>

                <div className="preview-amount">£4,800</div>
                <p className="preview-title">AI workflow audit + delivery sprint</p>

                <div className="mini-line-items">
                  <div className="mini-line-item">
                    <span>Discovery and systems mapping</span>
                    <strong>£1,200</strong>
                  </div>
                  <div className="mini-line-item">
                    <span>Prototype and validation</span>
                    <strong>£2,100</strong>
                  </div>
                  <div className="mini-line-item">
                    <span>Implementation support</span>
                    <strong>£1,500</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section container" id="services">
          <div className="section-heading">
            <p className="eyebrow">Services</p>
            <h2>Where Noventis Digital fits best</h2>
            <p>
              I work at the intersection of strategy, software and commercial
              execution. The output is usually a better system, a shipped product
              or both.
            </p>
          </div>

          <div className="service-grid">
            {offers.map((offer) => (
              <article className="service-card" key={offer.title}>
                <h3>{offer.title}</h3>
                <p>{offer.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container">
          <div className="section-heading">
            <p className="eyebrow">Approach</p>
            <h2>Fast enough to move, structured enough to trust</h2>
          </div>

          <div className="process-grid">
            {principles.map((principle) => (
              <article className="process-card" key={principle.step}>
                <span className="step-chip">{principle.step}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container portal-preview-section" id="portal-preview">
          <div className="section-heading">
            <p className="eyebrow">Client Portal</p>
            <h2>Give each client a private place to review quotes</h2>
            <p>
              The portal is designed for secure, per-client access so you can share
              quotes, scope, line items, milestones and approval next steps without
              chasing documents over email.
            </p>
          </div>

          <div className="portal-showcase">
            <div className="portal-benefits">
              <article className="benefit-card">
                <h3>Unique client logins</h3>
                <p>
                  Each client gets their own account, so quotes stay private and easy
                  to revisit.
                </p>
              </article>
              <article className="benefit-card">
                <h3>Quote detail that feels professional</h3>
                <p>
                  Show scope, pricing, milestones, validity windows and feedback
                  actions in one clean interface.
                </p>
              </article>
              <article className="benefit-card">
                <h3>GitHub Pages friendly</h3>
                <p>
                  The site can live on GitHub Pages while auth and live quote data are
                  handled by Supabase.
                </p>
              </article>
            </div>

            <div className="showcase-panel">
              <div className="showcase-header">
                <span className="status-pill is-emerald">Secure portal</span>
                <span>Portal workflow</span>
              </div>
              <ul className="showcase-list">
                <li>Client signs in with a unique email/password login</li>
                <li>Only that client&apos;s quotes are shown</li>
                <li>Scope, milestones and value are visible in one place</li>
                <li>Approval or revision requests go straight back to you</li>
              </ul>
              <Link className="primary-button full-width-button" to="/portal">
                Open the prototype portal
              </Link>
            </div>
          </div>
        </section>

        <section className="section container about-section" id="about">
          <div className="about-grid">
            <article className="about-card">
              <p className="eyebrow">About</p>
              <h2>Built around a personal reputation, not a generic agency template.</h2>
              <p>
                This site is positioned as a personal brand and commercial platform
                for consulting, builds and product experiments. It keeps the voice
                direct, technical and founder-friendly.
              </p>
              <a
                className="ghost-button"
                href="https://www.linkedin.com/in/jmbyrne/"
                target="_blank"
                rel="noreferrer"
              >
                View LinkedIn profile
              </a>
            </article>

            <article className="about-card">
              <p className="eyebrow">Best Fit</p>
              <h2>Teams that need clarity, speed and working software.</h2>
              <p>
                Best suited to founder-led companies, consultancies and operators
                who want to package expertise better, automate delivery or launch
                something new without unnecessary layers.
              </p>
              <a
                className="primary-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Noventis%20Digital%20enquiry"
              >
                hello@noventisdigital.co.uk
              </a>
            </article>
          </div>
        </section>

        <section className="section container">
          <div className="cta-banner">
            <div>
              <p className="eyebrow">Next step</p>
              <h2>Use this as the public front door and your private quote portal.</h2>
            </div>
            <div className="cta-actions">
              <a
                className="ghost-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Website%20and%20portal%20setup"
              >
                Talk about setup
              </a>
              <Link className="primary-button" to="/portal">
                Enter portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <p>Noventis Digital</p>
        <div className="footer-links">
          <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>
          <a href="https://www.linkedin.com/in/jmbyrne/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  )
}
