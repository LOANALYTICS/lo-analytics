"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Save, Trash2, Edit2, ReceiptPoundSterling, File } from "lucide-react"
import { useEffect, useState } from "react"
import { addTopic, deleteTopic, updateTopic, getTopics } from "@/services/question-bank/question-bank.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import QuestionPaperDropdown from "./question-qp/QuestionPaperDropdown"
import { getCurrentUser } from "@/server/utils/helper"

interface TopicManagerProps {
    courseId: string
}

interface TopicData {
    name: string;
    allowedQuestion: number;
}

interface Topic extends TopicData {
    questionCount: number;
}

export function TopicManager({ courseId }: TopicManagerProps) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [topicsData, setTopicsData] = useState<TopicData[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const [newInput, setNewInput] = useState("")
    const [newAllowedQuestion, setNewAllowedQuestion] = useState<string>('')
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState("")
    const [selectedTopics, setSelectedTopics] = useState<Topic[]>([])
    const [editAllowedQuestion, setEditAllowedQuestion] = useState<string>('')
    const [questionPapers, setQuestionPapers] = useState<{ id: string; name: string }[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        const fetchTopics = async () => {
            const fetchedTopics = await getTopics(courseId)
            setTopics(fetchedTopics)
        }
        fetchTopics()
    }, [courseId])
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser()
            setUser(user)
        }
        fetchUser()
    }, [])

    useEffect(() => {
        const fetchQuestionPapers = async () => {
            const papers = [
                { id: "1", name: "Midterm 2024" },
                { id: "2", name: "Final 2024" },
            ]
            setQuestionPapers(papers)
        }
        fetchQuestionPapers()
    }, [courseId])

    const handleSave = async (value: string, allowedQuestionStr: string) => {
        if (!value.trim()) return
        const allowedQuestion = allowedQuestionStr ? parseInt(allowedQuestionStr) : 0

        try {
            const newTopics = await addTopic(courseId, value, allowedQuestion)
            setTopics(newTopics)
            setNewInput("")
            setNewAllowedQuestion('')
            toast.success('Topic added successfully')
        } catch (error: any) {
            if (error.message === 'Topic already exists') {
                toast.warning('Topic already exists')
            } else {
                toast.error('Failed to add topic')
            }
        }
    }
    useEffect(() => {
        console.log(selectedTopics)
    }, [selectedTopics])

    const handleEdit = async (oldTopic: string, index: number) => {
        if (!editValue.trim()) return
        const allowedQuestion = editAllowedQuestion ? parseInt(editAllowedQuestion) : 0
        const success = await updateTopic(courseId, oldTopic, editValue, allowedQuestion)
        if (success) {
            const updatedTopics = await getTopics(courseId)
            setTopics(updatedTopics)
            setEditingIndex(null)
            setEditValue("")
            setEditAllowedQuestion('')
        }
    }

    const handleDeleteTopic = async (topic: string) => {
        const success = await deleteTopic(courseId, topic)
        if (success) {
            const updatedTopics = await getTopics(courseId)
            setTopics(updatedTopics)
            setSelectedTopics(prev => prev.filter(t => t.name !== topic))
        }
    }

    const toggleTopicSelection = (topic: Topic) => {
        setSelectedTopics(prev => 
            prev.find(t => t.name === topic.name)
                ? prev.filter(t => t.name !== topic.name)
                : [...prev, topic]
        )
    }

    const handleAddQuestions = (topicName: string) => {
        router.push(`/dashboard/question-bank/${courseId}/${encodeURIComponent(topicName)}`)
    }

    const handleGenerateQuestionPaperClick = () => {
        if (selectedTopics.length === 0) {
            toast.warning('Please select at least one topic')
            return
        }
        // Only pass required TopicData fields
        const topicsData: TopicData[] = selectedTopics.map(t => ({
            name: t.name,
            allowedQuestion: t.allowedQuestion
        }))
        setTopicsData(topicsData)
        setDialogOpen(true)
    }

    const handleQuestionPaperSelect = (paperId: string) => {
        console.log("Selected paper:", paperId)
    }

    const handleCourseSelect = (courseId: string) => {
        console.log("Selected course:", courseId)
        // Add your course selection logic here
    }

    return (
        <>
            <div className="space-y-4 flex-1">
                {topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2 max-w-2xl">
                        <div
                            className={`aspect-square rounded-md h-[38px] border cursor-pointer flex items-center justify-center
                                ${selectedTopics.find(t => t.name === topic.name) ? 'bg-black' : 'bg-white'}`}
                            onClick={() => toggleTopicSelection(topic)}
                        />
                        {editingIndex === index ? (
                            <div className="flex items-center gap-2 w-full">
                                <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="Edit topic"
                                />
                                <Input
                                    type="number"
                                    value={editAllowedQuestion}
                                    onChange={(e) => setEditAllowedQuestion(e.target.value)}
                                    placeholder="Allowed Questions"
                                    className="w-28 min-w-28"
                                />
                                <Button
                                    size="icon"
                                    onClick={() => handleEdit(topic.name, index)}
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full group">
                                <div className="flex-1 flex gap-2">
                                    <Input value={topic.name} disabled />
                                    <Input 
                                        value={topic.allowedQuestion ?? 0} 
                                        disabled 
                                        className="w-24" 
                                    />
                                    <div className="w-24 flex items-center justify-center border rounded-md bg-muted">
                                        {topic.questionCount} Q
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            setEditingIndex(index)
                                            setEditValue(topic.name)
                                            setEditAllowedQuestion((topic.allowedQuestion ?? 0).toString())
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteTopic(topic.name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button> 
                                    <Button
                                        size="icon"
                                        className="w-full"
                                        variant="default"
                                        onClick={() => handleAddQuestions(topic.name)}
                                    >
                                        <File className="h-4 w-4" />
                                        <span>Add Questions</span>
                                    </Button> 
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                <div className="flex items-center gap-2 max-w-2xl">
                    <Input
                        value={newInput}
                        onChange={(e) => setNewInput(e.target.value)}
                        placeholder="Add new topic"
                    />
                    <Input
                        type="number"
                        value={newAllowedQuestion}
                        onChange={(e) => setNewAllowedQuestion(e.target.value)}
                        placeholder="Allowed Questions"
                        className="w-28 min-w-28"
                    />
                    <Button size="icon" onClick={() => handleSave(newInput, newAllowedQuestion)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <section className='w-full h-fit flex justify-center gap-4'>
                <QuestionPaperDropdown topicsData={topicsData} open={dialogOpen} userId={user?.id} setOpen={setDialogOpen} />
                <Button
                    onClick={handleGenerateQuestionPaperClick}
                    className='bg-primary text-white self-end px-4 py-2 rounded-md'
                >
                    Generate Question paper
                </Button>
            </section>
        </>
    )
} 