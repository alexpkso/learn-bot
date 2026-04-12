import { Suspense } from 'react'
import LessonContent from './LessonContent'

export default function LessonPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-[13px] text-text-2">Загрузка занятия…</div>
      }
    >
      <LessonContent />
    </Suspense>
  )
}
