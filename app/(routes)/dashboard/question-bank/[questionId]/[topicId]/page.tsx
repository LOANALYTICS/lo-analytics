import { QuestionForm } from "@/components/shared/question-bank/QuestionForm"
import { QuestionUpload } from "@/components/shared/question-bank/questionUpload"



export default async function TopicQuestionsPage({ params }: any) {
    const { questionId: courseId, topicId } = await params
    
    return (
        <div className="p-6 h-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">
                    Topic: {decodeURIComponent(topicId)}
                </h1>
                <QuestionUpload 
                    courseId={courseId}
                    topic={decodeURIComponent(topicId)}
                />
            </div>

            <QuestionForm 
                courseId={courseId}
                topic={decodeURIComponent(topicId)}
            />
        </div>
    )
}
