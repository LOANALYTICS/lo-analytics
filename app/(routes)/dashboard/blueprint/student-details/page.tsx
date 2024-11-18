import CourseCard from '@/components/shared/course-card'
import StudentTable from '@/components/shared/student-table/StudentTable'
import { getCurrentUser } from '@/server/utils/helper'
import { getCoursesByCreator } from '@/services/courses.action'
import { getCoordinatorCourseTemplates } from '@/services/courseTemplate.action'
import React from 'react'

export default async function StudentDetailsPage() {
  const user = await getCurrentUser()
  const courses = await getCoursesByCreator(user?.id!);
  return (

    <main className="px-2">
      <h1 className="font-semibold text-lg"> Courses - ( {courses.length} )</h1>
      <section className="flex flex-col gap-2 mt-4">
        {courses.map(template => (
          <CourseCard key={template._id} href={`/dashboard/blueprint/student-details/${template._id}`} template={template} />
        ))}
      </section>
    </main>
    // <main>
    //    <StudentTable data={[]} courseId={"673ad4e5767e0f5f3ed2a0a1"}  />
    // </main>
  )
}
