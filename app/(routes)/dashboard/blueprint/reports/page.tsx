export const dynamic = 'force-dynamic'

import AssessmentCard from '@/components/shared/assessment-table/AssessmentCard'
import SemisterAssessmentReportButtons from '@/components/shared/assessment-table/SemisterAssessmentReportButtons'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/server/utils/helper'
import { getCoursesByCreator } from '@/services/courses.action'
import { CalendarIcon, DockIcon, SplitIcon } from 'lucide-react'
import React from 'react'
 
export default async function AssessmentPlanPage() {
  const user = await getCurrentUser()
  const courses = await getCoursesByCreator(user?.id!);
  return (
    <main className="px-2">

      <div className="flex justify-between items-center">
      <h1 className="font-semibold text-lg"> Reports - ( {courses.data.length} )</h1>

      <SemisterAssessmentReportButtons/>
       
       
      </div>
      <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 mt-4">
        {courses.data.map((course: any) => (
          <AssessmentCard standalone={true} key={course._id} href={`/dashboard/blueprint/assessment-plan/${course._id}`} course={course}  />
        ))}
      </section>
    </main>
  )
}
