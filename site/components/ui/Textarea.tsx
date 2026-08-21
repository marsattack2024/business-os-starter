interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

/**
 * Accessible textarea primitive — mirror of <Input>. Real <label>, required
 * asterisk, and error associated via id + aria-describedby + aria-invalid.
 */
export function Textarea({ label, error, className = "", id, required, ...props }: TextareaProps) {
  const textareaId = id ?? label.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
  const errorId = error ? `${textareaId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={textareaId}
        className="text-xs uppercase tracking-widest text-(--color-muted)"
      >
        {label}
        {required && (
          <span className="text-(--color-error)" aria-hidden="true"> *</span>
        )}
      </label>
      <textarea
        id={textareaId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`w-full resize-y border border-(--color-border) bg-transparent px-4 py-3 text-sm text-(--color-ink) outline-none transition-colors duration-200 focus:border-(--color-ink) focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-cream) min-h-[120px] ${
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
