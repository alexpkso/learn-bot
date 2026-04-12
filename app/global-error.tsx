'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body className="bg-[#F2F5FA] text-[#1B2559] antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <h1 className="text-lg font-bold">Критическая ошибка</h1>
          <p className="mt-2 max-w-md text-[13px] text-[#8A97B0]">
            Не удалось отрисовать страницу. Проверьте логи Vercel и переменные окружения.
          </p>
          {error.digest && (
            <p className="mt-2 text-[11px] text-[#8A97B0]">Digest: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-md bg-[#4361EE] px-4 py-2 text-[12px] font-bold text-white"
          >
            Повторить
          </button>
        </div>
      </body>
    </html>
  )
}
