export const dynamic = 'force-dynamic'

import React from 'react'
import { getCoordinatorCourseTemplates } from '@/services/courseTemplate.action'
import { getCurrentUser } from '@/server/utils/helper'
import CourseCard from '@/components/shared/course-card'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function page({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  const coursesTemplate = await getCoordinatorCourseTemplates(user?.id!)

  // Await searchParams before using its properties
  const params = await searchParams

  // Check if src=lc query parameter exists
  const srcParam = params.src === 'lc' ? '?src=lc' : ''

  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg"> Courses - ( {coursesTemplate.length} )</h1>
      <section className="flex flex-col gap-2 mt-4">
        {coursesTemplate.map(template => (
          <CourseCard
            key={template._id}
            href={`/dashboard/new-course/${template._id}${srcParam}`}
            template={template}
          />
        ))}
      </section>
    </main>
  )
}
