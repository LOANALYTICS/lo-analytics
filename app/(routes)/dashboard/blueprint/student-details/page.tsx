export const dynamic = 'force-dynamic'

import CourseCard from '@/components/shared/course-card'
import { getCurrentUser } from '@/server/utils/helper'
import { getCoursesByCreator } from '@/services/courses.action'
import React from 'react'

export default async function StudentDetailsPage() {
  const user = await getCurrentUser()
  const courses = await getCoursesByCreator(user?.id!);
  return (

    <main className="px-2">
      <h1 className="font-semibold text-lg"> Course students - ( {courses.data.length} )</h1>
      <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 mt-4">
        {courses.data.map((course: any) => (
          <CourseCard key={course._id} href={`/dashboard/blueprint/student-details/${course._id}`} template={course} />
        ))}
      </section>
    </main>
 
  )
}
