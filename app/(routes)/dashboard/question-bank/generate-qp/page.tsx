'use client'
import { GenerateQuestionTable } from '@/components/shared/question-bank/question-qp/GenerateQuestionTable'
import { useSearchParams } from 'next/navigation'
import { TopicData } from '@/types/question-bank'

export default function GenerateQPPage() {
    const searchParams = useSearchParams()
    const courseId = searchParams.get('courseId') || ''
    const topicsParam = searchParams.get('topics')
    const topics: TopicData[] = topicsParam ? JSON.parse(decodeURIComponent(topicsParam)) : []

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Generate Question Paper</h1>
            <GenerateQuestionTable topics={topics} courseId={courseId} />
           
        </div>
    )
}
