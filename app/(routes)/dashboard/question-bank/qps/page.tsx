
import DropdownBtn from '@/components/shared/question-bank/question-qp/DropdownBtn'
import { getCurrentUser } from '@/server/utils/helper'
import { getQuestionPapers } from '@/services/question-bank/generate-qp.service'
import React from 'react'


export default async function page() {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  const questionPapers = await getQuestionPapers(user?.id)
  console.log(questionPapers, "questionPapers")

  return (
    <section className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4'>
      {questionPapers.map((questionPaper: any) => (
        <div key={questionPaper._id} className='border p-4 flex rounded-md justify-between'>
          <div className='flex flex-col'>
            <p className='text-sm text-gray-500'>{questionPaper.course.course_name}</p>
            <p className='text-sm text-gray-500'>{questionPaper.examName}</p>
          </div>
          <div className='flex flex-col gap-2'>
            <DropdownBtn questionPaperId={questionPaper._id} />
          
          </div>
      
        </div>
      ))}
    </section>
  )
}
