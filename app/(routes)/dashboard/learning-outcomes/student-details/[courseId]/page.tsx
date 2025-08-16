import SectionHeader from '@/components/core/SectionHeader'
import StudentTable from '@/components/shared/student-table/StudentTable'
import { getAssessmentStudents } from '@/services/assessment.action'
import { getCourseById } from '@/services/courses.action'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{
    courseId: string
  }>
}

export default async function StudentDetailsPage({ params }: Props) {
  const { courseId } = await params
  
  const assessment = await getAssessmentStudents(courseId)
  const course = await getCourseById(courseId)



  if (!assessment) {
    notFound()
  }
  if (!course) {
    notFound()
  }

  return (
    <main className="space-y-2 p-2">
     <SectionHeader courseDetails={course} />
      
      <StudentTable 
        data={assessment.data || []} 
        courseId={courseId} 
      />
    </main>
  )
}
