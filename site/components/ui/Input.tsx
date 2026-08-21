interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Accessible text input primitive. Renders a real <label>, a visible required
 * asterisk when `required`, and programmatically-associates the error via
 * id + aria-describedby + aria-invalid. Use this for every form field so a11y
 * stays consistent across forks (don't hand-roll labelled inputs).
 */
export function Input({ label, error, className = "", id, required, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs uppercase tracking-widest text-(--color-muted)"
      >
        {label}
        {required && (
          <span className="text-(--color-error)" aria-hidden="true"> *</span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`w-full border border-(--color-border) bg-transparent px-4 py-3 text-sm text-(--color-ink) outline-none transition-colors duration-200 focus:border-(--color-ink) focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-cream) ${
          error ? "border-(--color-error)" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-(--color-error)">
          {error}
        </p>
      )}
    </div>
  );
}
