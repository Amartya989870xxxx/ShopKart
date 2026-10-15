// Consistent loading / empty / error panel used across pages.
// variant: "loading" | "empty" | "error"
function StatePanel({
  variant = "empty",
  icon,
  title,
  message,
  children,
}) {
  const isLoading = variant === "loading";

  return (
    <div
      className={`state-panel state-${variant}`}
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        icon && (
          <span className="state-icon" aria-hidden="true">
            {icon}
          </span>
        )
      )}

      {title && <h2 className="state-title">{title}</h2>}

      {message && <p className="state-message">{message}</p>}

      {children && <div className="state-actions">{children}</div>}
    </div>
  );
}

export default StatePanel;
