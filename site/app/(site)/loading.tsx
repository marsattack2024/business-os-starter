export default function Loading() {
  return (
    <div className="min-h-screen bg-(--color-cream) animate-pulse">
      {/* Nav skeleton */}
      <div className="h-16 bg-(--color-border)/40" />

      {/* Hero skeleton — match the live hero's dvh to avoid a swap-time shift */}
      <div className="w-full h-[95dvh] bg-(--color-border)/60" />

      {/* Strip skeleton */}
      <div className="py-8 px-6 flex justify-center gap-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-24 bg-(--color-border) rounded" />
        ))}
      </div>

      {/* Content skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="py-24 px-6 max-w-5xl mx-auto space-y-6">
          <div className="h-3 w-24 bg-(--color-border) rounded mx-auto" />
          <div className="h-8 w-2/3 bg-(--color-border) rounded mx-auto" />
          <div className="h-4 w-1/2 bg-(--color-border) rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}
