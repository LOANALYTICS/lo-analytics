import { QuestionForm } from "@/components/shared/question-bank/QuestionForm"

interface Props {
    params: {
        questionId: string
        topicId: string
    }
}

export default async function TopicQuestionsPage({ params }: Props) {
    const { questionId, topicId } = await params
    
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">
                Questions for Topic: {decodeURIComponent(topicId)}
            </h1>
            
            <QuestionForm 
                courseId={questionId}
                topic={decodeURIComponent(topicId)}
            />
        </div>
    )
}
