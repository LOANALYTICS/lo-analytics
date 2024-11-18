import React from 'react'
import { getCoordinatorCourseTemplates } from '@/services/courseTemplate.action'
import { getCurrentUser } from '@/server/utils/helper'
import Link from 'next/link'
export default async function page() {
  const user = await getCurrentUser()
  console.log(user)
  const coursesTemplate = await getCoordinatorCourseTemplates(user?.id!) 
  console.log(coursesTemplate)
  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg"> Courses - ( {coursesTemplate.length} )</h1>
      <section className="flex flex-col gap-2 mt-4">
        {coursesTemplate.map(template => (
          <Link
            key={template._id}
           href={`/dashboard/new-course/${template._id}`}
            className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
          >
            <h2>{template.course_name}</h2>
          </Link>
        ))}
      </section>
    </main>
  )
}
