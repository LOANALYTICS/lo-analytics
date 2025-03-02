"use client"

import { useState, useEffect, useCallback } from "react"
import { TiptapEditor } from "./TiptapEditor"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createQuestion, getQuestions, updateQuestion } from "@/services/question-bank/question.service"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import QuestionsListing from "./QuestionsListing"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuestionFormProps {
    courseId: string;
    topic: string;
    refreshTrigger: number;
}

// interface CreateQuestionInput {
//     courseId: string
//     topic: string
//     question: string
//     options: string[]
//     correctAnswer: string
//     clos?: number

// }

export function QuestionForm({ courseId, topic, refreshTrigger }: QuestionFormProps) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<string[]>(['', '', '', ''])
    const [correctAnswer, setCorrectAnswer] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [questions, setQuestions] = useState<any[]>([])
    const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
    const [selectedClo, setSelectedClo] = useState<string>('')

    const fetchQuestions = async () => {
        const questions = await getQuestions(courseId, topic)
        setQuestions(questions)
    }

    const handleQuestionSelect = (question: any) => {
        setSelectedQuestion(question)
        if (!question) {
            setQuestion('')
            setOptions(['', '', '', ''])
            setCorrectAnswer('')
            setSelectedClo('')
        } else {
            setQuestion(question.question)
            setOptions(question.options)
            setCorrectAnswer(question.correctAnswer)
            setSelectedClo(question.clos.toString())
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!question || options.some(opt => !opt) || !correctAnswer) {
            toast.error('Please fill all fields')
            return
        }

        if (!selectedClo) {
            toast.error('Please select a CLO')
            return
        }

        try {
            setIsLoading(true)
            
            if (selectedQuestion) {
                // Update existing question
                await updateQuestion(selectedQuestion._id, {
                    courseId,
                    topic,
                    question,
                    options,
                    correctAnswer,
                    clos: parseInt(selectedClo)
                })
                toast.success('Question updated successfully')
            } else {
                // Create new question
                await createQuestion({
                    courseId,
                    topic,
                    question,
                    options,
                    correctAnswer,
                    clos: parseInt(selectedClo)
                })
                toast.success('Question added successfully')
            }

            // Reset form and selection
            setQuestion('')
            setOptions(['', '', '', ''])
            setCorrectAnswer('')
            setSelectedQuestion(null)
            
            // Fetch updated questions
            await fetchQuestions()
        } catch (error) {
            toast.error(selectedQuestion ? 'Failed to update question' : 'Failed to add question')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }


    const handleOptionChange = useCallback((index: number, content: string) => {
        setOptions(prev => {
            const newOptions = [...prev]
            newOptions[index] = content
            return newOptions
        })
        
        // Update correctAnswer if the edited option was selected
        if (correctAnswer === options[index]) {
            setCorrectAnswer(content)
        }
    }, [correctAnswer, options])

    useEffect(() => {
        fetchQuestions()
    }, [courseId, topic])

    useEffect(() => {
        fetchQuestions()
    }, [refreshTrigger])

    return (
        <main className="flex gap-2 w-full">
            <form onSubmit={handleSubmit} className="w-full flex-1">
            <Card className="bg-background border-2 border-neutral-800">
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                        <label className="text-sm font-medium">Question</label>
                        <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">(CLO)</label>
                        <Select
                            value={selectedClo}
                            onValueChange={setSelectedClo}
                    
                        >
                            <SelectTrigger         className="border-2 border-neutral-800">
                                <SelectValue placeholder="Select CLO" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 20 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        CLO {i + 1}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>

                        </div>
                        <TiptapEditor
                            content={question}
                            onChange={setQuestion}
                            placeholder="Enter your question here..."
                            isQuestion={true}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium">Options</label>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className={`w-3.5 h-full min-h-[40px] self-start cursor-pointer rounded-sm border-2 border-neutral-800 ${
                                        correctAnswer && correctAnswer === option 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'bg-white hover:bg-muted'
                                    }`}
                                    onClick={() => setCorrectAnswer(option)}
                                />
                                <div className="flex-1">
                                    <TiptapEditor
                                        key={`option-${index}`}
                                        content={option}
                                        onChange={(content) => handleOptionChange(index, content)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                </div>
                                
                            </div>
                        ))}
                        {options.length < 6 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setOptions([...options, ""])}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                            </Button>
                        )}
                    </div>

                    

                    <div className="flex justify-end gap-2">
                        <Button 
                            type="submit"
                            disabled={!question || options.some(opt => !opt) || !correctAnswer || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {selectedQuestion ? 'Updating...' : 'Saving...'}
                                </>
                            ) : (
                                selectedQuestion ? 'Update Question' : 'Save Question'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
        <QuestionsListing 
            questions={questions} 
            onQuestionSelect={handleQuestionSelect}
            selectedQuestion={selectedQuestion}
        />
        </main>
        
    )
} 