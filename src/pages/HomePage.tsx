import { Link } from 'react-router-dom'

const capabilities = [
  {
    kicker: 'AI',
    title: 'AI-powered solutions and workflow design',
    description:
      'Find where AI can remove friction, improve decision flow, and create practical leverage inside the way the business operates.',
    image: '/images/ai-strategy-visual.svg',
    alt: 'Abstract AI strategy visual with luminous network lines and flowing motion.',
  },
  {
    kicker: 'Leadership',
    title: 'Fractional CTO and technology direction',
    description:
      'Bring senior technical judgment into strategy, architecture, delivery, hiring, and executive decision making without building a full internal technology function.',
    image: '/images/portal-systems-visual.svg',
    alt: 'Abstract leadership visual with layered interface geometry and directional movement.',
  },
  {
    kicker: 'Transformation',
    title: 'Transformation that changes operations',
    description:
      'Turn strategy into better systems, stronger operating rhythm, clearer accountability, and delivery the organisation can actually feel.',
    image: '/images/transformation-visual.svg',
    alt: 'Abstract business transformation visual with layered signals and upward movement.',
  },
]

const principles = [
  {
    title: 'Executive-level perspective',
    description:
      'Decisions are shaped across strategy, architecture, delivery, operations, and commercial reality rather than from a narrow delivery lane.',
  },
  {
    title: 'AI with operating value',
    description:
      'AI is applied where it improves throughput, clarity, decision making, or client experience, not where it merely sounds current.',
  },
  {
    title: 'Delivery that survives reality',
    description:
      'The work has to function inside the messiness of a real business, not just read well in a strategy deck.',
  },
]

const ledgerItems = [
  'AI solutions',
  'Fractional CTO',
  'Tech leadership',
  'Transformation',
]

const ribbonItems = [
  'AI-powered solutions',
  'Fractional CTO',
  'Technology strategy',
  'Operational transformation',
  'Architecture direction',
  'Delivery leadership',
]

const introSignals = ['CTO', 'AI', 'Scale']

const approachSignals = ['Board', 'Build', 'Change']

export function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header container">
        <Link className="brand-lockup" to="/">
          <span aria-hidden="true" className="brand-mark" />
          <span className="brand-copy">
            <strong>NOVENTIS</strong>
            <span>AI-powered solutions and executive technology leadership</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="top-nav">
          <a href="#services">Capabilities</a>
          <a href="#approach">Approach</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="header-actions">
          <a
            className="ghost-button"
            href="mailto:hello@noventisdigital.co.uk?subject=Noventis%20Digital%20enquiry"
          >
            hello@noventisdigital.co.uk
          </a>
          <Link className="primary-button" to="/portal">
            Open portal
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section hero-section--glass">
          <div className="container hero-column">
            <div aria-hidden="true" className="hero-aura">
              <span className="hero-orbit hero-orbit--outer" />
              <span className="hero-orbit hero-orbit--inner" />
              <span className="hero-comet hero-comet--one">AI</span>
              <span className="hero-comet hero-comet--two">Ops</span>
              <span className="hero-comet hero-comet--three">DX</span>
            </div>

            <p className="eyebrow motion-reveal motion-reveal--1">
              Fractional CTO advisory, AI strategy, and transformation delivery
            </p>
            <h1
              className="hero-title"
              aria-label="AI-powered solutions with executive technology leadership"
            >
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--1">AI-powered solutions</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--2">with executive</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--3">technology leadership.</span>
              </span>
            </h1>
            <p className="hero-text motion-reveal motion-reveal--3">
              Noventis brings executive-level technology judgment to AI strategy,
              product direction, architecture, and transformation so the business
              gets sharper systems, stronger delivery, and practical change.
            </p>

            <div className="hero-actions motion-reveal motion-reveal--4">
              <a
                className="primary-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Project%20enquiry"
              >
                Start a conversation
              </a>
              <Link className="ghost-button" to="/portal">
                View client portal
              </Link>
            </div>

            <div aria-label="Core offer" className="hero-ledger motion-reveal motion-reveal--5">
              {ledgerItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--flush">
          <div className="marquee-shell">
            <div className="marquee-track">
              {[...ribbonItems, ...ribbonItems].map((item, index) => (
                <span className="marquee-item" key={`${item}-${index}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container intro-section">
          <div className="intro-shell">
            <div className="intro-grid">
              <div>
                <p className="eyebrow">Ethos</p>
                <h2>Senior technology judgment, applied where the business actually moves.</h2>
              </div>

              <div className="body-stack">
                <p>
                  This is not generic digital support. It is hands-on CTO-level
                  thinking for organisations working through AI adoption, product
                  decisions, delivery pressure, and operational complexity.
                </p>
                <p>
                  The work spans AI-powered solutions, technology strategy,
                  architecture, delivery leadership, and the executive decisions
                  that determine whether change sticks.
                </p>
              </div>
            </div>

            <div aria-hidden="true" className="ambient-panel ambient-panel--intro">
              <span className="ambient-orbit ambient-orbit--large" />
              <span className="ambient-orbit ambient-orbit--small" />
              <span className="ambient-pulse ambient-pulse--one" />
              <span className="ambient-pulse ambient-pulse--two" />
              {introSignals.map((signal, index) => (
                <span className={`ambient-chip ambient-chip--${index + 1}`} key={signal}>
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container" id="services">
          <div className="section-heading section-heading--split section-heading--ambient">
            <div aria-hidden="true" className="section-aura section-aura--services">
              <span className="section-aura-ring section-aura-ring--outer" />
              <span className="section-aura-ring section-aura-ring--inner" />
              <span className="section-aura-dot section-aura-dot--one" />
              <span className="section-aura-dot section-aura-dot--two" />
            </div>
            <div>
              <p className="eyebrow">Core mandates</p>
              <h2>AI solutions. Technology leadership. Transformation.</h2>
            </div>
            <p className="section-deck">
              These are the areas where experienced technical leadership creates
              disproportionate leverage across the organisation.
            </p>
          </div>

          <div className="capability-grid">
            {capabilities.map((capability, index) => (
              <article className="capability-card" key={capability.title}>
                <div className="capability-image-wrap">
                  <img
                    alt={capability.alt}
                    className="capability-image"
                    loading="lazy"
                    src={capability.image}
                  />
                  <span className="capability-index">{`0${index + 1}`}</span>
                </div>
                <div className="capability-copy">
                  <p className="eyebrow">{capability.kicker}</p>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section container" id="approach">
          <div className="section-heading section-heading--ambient">
            <div aria-hidden="true" className="section-aura section-aura--approach">
              <span className="section-aura-ring section-aura-ring--outer" />
              <span className="section-aura-ring section-aura-ring--inner" />
              {approachSignals.map((signal, index) => (
                <span className={`section-aura-chip section-aura-chip--${index + 1}`} key={signal}>
                  {signal}
                </span>
              ))}
            </div>
            <p className="eyebrow">Approach</p>
            <h2>Measured presentation. Decisive execution underneath.</h2>
          </div>

          <div className="principle-grid">
            {principles.map((principle) => (
              <article className="principle-card" key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container" id="contact">
          <div className="closing-block">
            <div className="closing-stage">
              <div className="closing-copy">
                <p className="eyebrow">Contact</p>
                <h2>
                  For leadership teams that need stronger AI capability, sharper
                  technology direction, and real operating progress.
                </h2>
                <p className="closing-text">
                  The value is not theatre. It is clear thinking, experienced
                  leadership, and delivery that changes how the organisation
                  actually runs.
                </p>
                <div className="hero-actions">
                  <a
                    className="primary-button"
                    href="mailto:hello@noventisdigital.co.uk?subject=Portal%20and%20systems%20project"
                  >
                    hello@noventisdigital.co.uk
                  </a>
                  <Link className="ghost-button" to="/portal">
                    Open client portal
                  </Link>
                </div>
              </div>

              <div className="closing-panel">
                <p className="closing-panel-label">Operating focus</p>
                <div className="closing-panel-lines">
                  <span>AI solutions</span>
                  <span>Technology direction</span>
                  <span>Transformation delivery</span>
                </div>
              </div>

              <div aria-hidden="true" className="closing-wordmark">
                NOVENTIS
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <p className="site-footer-mark">NOVENTIS DIGITAL</p>
            <p>
              AI-powered solutions and executive technology leadership for
              businesses that need substance, not theatre.
            </p>
          </div>

          <div className="footer-links">
            <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>
            <Link to="/portal">Client portal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
