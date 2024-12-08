import { QuestionForm } from "@/components/shared/question-bank/QuestionForm"

interface Props {
    params: {
        questionId: string
        topicId: string
    }
}

export default async function TopicQuestionsPage({ params }: Props) {
    const { questionId: courseId, topicId } = await params
    
    return (
        <div className="p-6 h-full">
            <h1 className="text-2xl font-bold mb-4">
                Topic: {decodeURIComponent(topicId)}
            </h1>
            
            <QuestionForm 
                courseId={courseId}
                topic={decodeURIComponent(topicId)}
            />
        </div>
    )
}
