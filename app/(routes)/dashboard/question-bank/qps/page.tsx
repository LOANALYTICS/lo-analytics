import DropdownBtn from '@/components/shared/question-bank/question-qp/DropdownBtn'
import { FilterDialog } from '@/components/shared/question-bank/question-qp/FilterDialog'
import { getCurrentUser } from '@/server/utils/helper'
import { getQuestionPapers } from '@/services/question-bank/generate-qp.service'
import React from 'react'
import { getCoordinatorCourseTemplates } from '@/services/courseTemplate.action'
import dayjs from 'dayjs'
export default async function page() {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  const questionPapers = await getQuestionPapers(user?.id)
  const coursesTemplate = await getCoordinatorCourseTemplates(user?.id!) 
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FilterDialog courseTemplates={JSON.parse(JSON.stringify(coursesTemplate))} />
      </div>
      <section className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4'>
        {questionPapers.map((questionPaper: any) => (
          <div key={questionPaper._id} className='border p-4 flex rounded-md justify-between'>
            <div className='flex flex-col'>
              <p className='text-sm text-gray-500'> <span className='font-bold'>Course Name:</span> {questionPaper.course.course_name}</p>
              <p className='text-sm text-gray-500'> <span className='font-bold'>Exam Name:</span> {questionPaper.examName}</p>
              <p className='text-sm text-gray-500'> <span className='font-bold'>Created At:</span> {dayjs(questionPaper.createdAt).format('DD-MM-YYYY')}</p>
            </div>
            <div className='flex flex-col gap-2'>
              <DropdownBtn questionPaperId={questionPaper._id} courseCode={questionPaper?.course?.course_code} examName={questionPaper?.examName} academicYear={questionPaper?.academicYear} courseId={questionPaper?.course?._id}/>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
