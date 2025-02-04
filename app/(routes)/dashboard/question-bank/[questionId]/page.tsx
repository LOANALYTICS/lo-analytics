import React from 'react'
import { getCourseTemplateById } from '@/services/courseTemplate.action'
import { TopicManager } from '@/components/shared/question-bank/TopicManager'
import Link from 'next/link'

interface Props {
    params: Promise<{
      questionId: string
    }>
}

export default async function QuestionBankPage({ params }: Props) {
  const { questionId } = await params
  const courseTemplate = await getCourseTemplateById(questionId)

  if (!courseTemplate) {
    return <div>Course not found</div>
  }

  return (
    <div className="p-2 h-full  flex flex-col w-full relative">
    
     
      <section className='flex-1 flex flex-col '>
      <div className="text-sm text-muted-foreground mb-6">
      <h1 className="text-2xl font-bold ">
        Question Bank - {courseTemplate.course_name}
      </h1>
        Course Code: {courseTemplate.course_code}
      </div>

      <TopicManager courseId={courseTemplate._id} />
      </section>
     

    </div>
  )
}
