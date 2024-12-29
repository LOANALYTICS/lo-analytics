'use client'

import { QuestionForm } from "./QuestionForm"
import { useState } from "react"
import { QuestionUpload } from "./questionUpload"

interface QuestionsContainerProps {
    courseId: string
    topic: string
}

export function QuestionsContainer({ courseId, topic }: QuestionsContainerProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    return (
        <>
            <div className="flex justify-end mb-4">
                <QuestionUpload 
                    courseId={courseId}
                    topic={topic}
                    onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            </div>

            <QuestionForm 
                courseId={courseId}
                topic={topic}
                refreshTrigger={refreshTrigger}
            />
        </>
    )
} 