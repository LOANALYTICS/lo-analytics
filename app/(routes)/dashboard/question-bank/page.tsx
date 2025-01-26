import CourseCard from '@/components/shared/course-card'
import { getCurrentUser } from '@/server/utils/helper'
import { getCoordinatorCourseTemplates } from '@/services/courseTemplate.action'
import React from 'react'

export default async function QuestionBank() {
  const user = await getCurrentUser()
  const coursesTemplate = await getCoordinatorCourseTemplates(user?.id!) 
  return (
  <main className="px-2">
    <h1 className="font-semibold text-lg"> Courses - ( {coursesTemplate.length} )</h1>
    <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 mt-4">
      {coursesTemplate.map(template => (
        <CourseCard key={template._id} isQP={true}  href={`/dashboard/question-bank/${template._id}?course_name=${template.course_name}&course_code=${template.course_code}`} template={template} />
      ))}
    </section>
  </main>
  )
}
