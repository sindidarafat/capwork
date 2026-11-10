// Small display pieces shared by every page.

export function Flag({ value }) {
  if (!value) return null;
  return <span className={`flag flag-${value.toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>;
}

export function Priority({ value }) {
  if (!value) return null;
  return <span className={`prio prio-${value.toLowerCase()}`}>{value}</span>;
}

export function TypeTag({ value }) {
  if (!value) return null;
  return <span className={`type type-${value.toLowerCase()}`}>{value}</span>;
}

export function PageHead({ title, lead, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function Saved({ show, children = 'Saved.' }) {
  if (!show) return null;
  return <div className="toast" role="status">{children}</div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export const pct = (v) => (v === null || v === undefined ? '' : `${Math.round(v * 100)}%`);
export const hrs = (v) => (v ? (Math.round(v * 10) / 10).toString() : '');
export const dash = (v) => (v ? v : '');
