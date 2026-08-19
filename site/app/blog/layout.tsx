// ============================================================
// THE FRAME AROUND YOUR BLOG PAGES
//
// This puts the same thin bar at the top and the same line at
// the bottom on your blog list and on every post, so they look
// like the rest of your site.
//
// The only thing worth changing here is your business name.
// Everything else can be left alone.
// ============================================================

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-6 py-5">
          <a href="/" className="text-lg font-semibold tracking-tight">
            {"{{BUSINESS_NAME}}"}
          </a>
          <a
            href="/"
            className="text-sm text-muted transition-colors hover:text-brand"
          >
            Back to home
          </a>
        </div>
      </header>

      {children}

      <footer className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted">
          <p className="font-medium text-ink">{"{{BUSINESS_NAME}}"}</p>
          <p className="mt-2">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
