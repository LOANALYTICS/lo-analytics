"use client"

import { useState } from "react"
import { TiptapEditor } from "./TiptapEditor"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createQuestion } from "@/services/question-bank/question.service"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

interface QuestionFormProps {
    courseId: string;
    topic: string;
}

export function QuestionForm({ courseId, topic }: QuestionFormProps) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<string[]>(['', '', '', ''])
    const [correctAnswer, setCorrectAnswer] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!question || options.some(opt => !opt) || !correctAnswer) {
            toast.error('Please fill all fields')
            return
        }

        try {
            setIsLoading(true)
            await createQuestion({
                courseId,
                topic,
                question,
                options,
                correctAnswer
            })

            toast.success('Question added successfully')
            setQuestion('')
            setOptions(['', '', '', ''])
            setCorrectAnswer('')
        } catch (error) {
            toast.error('Failed to add question')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className="bg-background">
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Question</label>
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
                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={correctAnswer === option}
                                    onChange={() => setCorrectAnswer(option)}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <TiptapEditor
                                        content={option}
                                        onChange={(content) => {
                                            const newOptions = [...options]
                                            newOptions[index] = content
                                            setOptions(newOptions)
                                            if (correctAnswer === options[index]) {
                                                setCorrectAnswer(content)
                                            }
                                        }}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                </div>
                                {index >= 4 && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            const newOptions = options.filter((_, i) => i !== index)
                                            setOptions(newOptions)
                                            if (correctAnswer === option) setCorrectAnswer("")
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
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
                            disabled={!question || options.some(opt => !opt) || !correctAnswer}
                        >
                            Save Question
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
} 