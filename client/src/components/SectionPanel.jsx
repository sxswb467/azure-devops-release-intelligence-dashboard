/**
 * Render a reusable surface section with consistent heading treatment.
 *
 * @param {Object} props - Component props.
 * @param {string} props.title - Section title.
 * @param {string} props.description - Section description.
 * @param {JSX.Element | JSX.Element[]} props.children - Section content.
 * @param {string} [props.eyebrow] - Optional section eyebrow.
 * @param {JSX.Element} [props.trailing] - Optional header-side content.
 * @returns {JSX.Element} Section panel.
 */
export function SectionPanel({ title, description, children, eyebrow, trailing }) {
  return (
    <section className="section-panel">
      <header className="section-panel__header">
        <div>
          {eyebrow ? <p className="section-panel__eyebrow">{eyebrow}</p> : null}
          <h2 className="section-panel__title">{title}</h2>
          <p className="section-panel__description">{description}</p>
        </div>
        {trailing ? <div className="section-panel__trailing">{trailing}</div> : null}
      </header>
      <div className="section-panel__body">{children}</div>
    </section>
  );
}
