import { memo } from 'react'
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const QuestionsListing = memo(({ 
    questions, 
    onQuestionSelect,
    selectedQuestion 
}: { 
    questions: any,
    onQuestionSelect: (question: any) => void,
    selectedQuestion: any
}) => {
    return (
        <div className='flex-1 border rounded-xl w-72 min-w-72 max-w-72 p-4 h-full flex flex-col'>
            <div className="flex-1 overflow-y-auto space-y-2">
                {questions.map((question: any) => (
                    <div 
                        key={question._id} 
                        className={`border py-2 flex justify-between items-center px-4 cursor-pointer rounded-md ${selectedQuestion?._id === question._id ? 'bg-black text-white' : ''}`}
                        onClick={() => onQuestionSelect(question)}
                    >
                        <div 
                            dangerouslySetInnerHTML={{ __html: question.question }}
                            className="prose prose-sm max-w-none"
                        />
                        {selectedQuestion?._id === question._id && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className='w-8 h-8 border'
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onQuestionSelect(null)
                                }}
                            >
                                <X className='w-4 h-4' />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
})

QuestionsListing.displayName = 'QuestionsListing'

export default QuestionsListing