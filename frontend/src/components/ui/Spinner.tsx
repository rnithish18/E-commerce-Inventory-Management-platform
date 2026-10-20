export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-4' }[size]
  return (
    <div className={`animate-spin rounded-full border-orange-500 border-t-transparent ${s}`} role="status">
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-900">
      <Spinner size="lg" />
    </div>
  )
}
