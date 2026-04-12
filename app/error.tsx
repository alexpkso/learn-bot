'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
      <h1 className="text-lg font-bold text-text-1">Ошибка приложения</h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-text-2">
        На сервере произошла ошибка. Частые причины: не заданы переменные Supabase на
        Vercel, не выполнена SQL-миграция, или сессия устарела. Попробуйте войти снова.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 max-h-48 max-w-full overflow-auto rounded-card border border-border bg-white p-3 text-left text-[11px] text-red-700">
          {error.message}
        </pre>
      )}
      {error.digest && (
        <p className="mt-2 text-[11px] text-text-2">Digest: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-btn bg-primary px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-700"
      >
        Повторить
      </button>
    </div>
  )
}
