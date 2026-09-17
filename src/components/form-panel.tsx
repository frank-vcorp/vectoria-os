import type { ReactNode } from "react";

export function FormPanel({
  title,
  description,
  children,
  actions,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`form-panel ${className}`.trim()}>
      <div className="form-panel-header">
        <h2 className="form-panel-title">{title}</h2>
        {description ? <p className="form-panel-desc">{description}</p> : null}
      </div>
      <div className="form-panel-body">{children}</div>
      {actions ? <div className="form-panel-footer">{actions}</div> : null}
    </div>
  );
}

export function FormSectionBlock({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`form-section-block ${className}`.trim()}>
      <div className="form-section-block-header">
        <h3 className="form-section-block-title">{title}</h3>
        {description ? <p className="form-section-block-desc">{description}</p> : null}
      </div>
      <div className="form-section-block-body">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
