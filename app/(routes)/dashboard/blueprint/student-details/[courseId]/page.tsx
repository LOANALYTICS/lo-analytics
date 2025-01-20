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
  
  const course = await getAssessmentStudents(courseId)




  if (!course) {
    notFound()
  }

  return (
    <main className="px-2">
      <div className="mb-4">
        {/* <h1 className="font-semibold text-lg">{course.course_name}</h1>
        <p className="text-sm text-muted-foreground">Course Code: {course}</p> */}
      </div>
      
      <StudentTable 
        data={course.data || []} 
        courseId={courseId} 
      />
    </main>
  )
}
