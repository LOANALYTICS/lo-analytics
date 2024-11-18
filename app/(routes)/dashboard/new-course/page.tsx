import React from 'react'
import { getCoordinatorCourseTemplates } from '@/services/courseTemplate.action'
import { getCurrentUser } from '@/server/utils/helper'
import Link from 'next/link'
import CourseCard from '@/components/shared/course-card'
export default async function page() {
  const user = await getCurrentUser()
  const coursesTemplate = await getCoordinatorCourseTemplates(user?.id!) 
  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg"> Courses - ( {coursesTemplate.length} )</h1>
      <section className="flex flex-col gap-2 mt-4">
        {coursesTemplate.map(template => (
          <CourseCard key={template._id} href={`/dashboard/new-course/${template._id}`} template={template} />
        ))}
      </section>
    </main>
  )
}
