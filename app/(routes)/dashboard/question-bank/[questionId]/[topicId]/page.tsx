import NavigateBack from "@/components/core/NavigateBack"
import { QuestionsContainer } from "@/components/shared/question-bank/QuestionsContainer"


export default async function TopicQuestionsPage({ params }: any) {
    const { questionId: courseId, topicId } = await params

    return (
        <div className="p-6 h-full">
            <div className="flex gap-4 items-center mb-4">
            <NavigateBack/>
                <h1 className="text-2xl font-bold">
                    Topic: {decodeURIComponent(topicId)}
                </h1>
            </div>

            <QuestionsContainer 
                courseId={courseId}
                topic={decodeURIComponent(topicId)}
            />
        </div>
    )
}
