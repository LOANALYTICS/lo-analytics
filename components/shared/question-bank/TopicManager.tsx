"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Save, Trash2, Edit2, File } from "lucide-react"
import { useEffect, useState } from "react"
import { addTopic, deleteTopic, updateTopic, getTopics } from "@/services/question-bank/question-bank.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import QuestionPaperDropdown from "./question-qp/QuestionPaperDropdown"
import { getCurrentUser } from "@/server/utils/helper"
import Link from "next/link"

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

    const handleEdit = async (oldTopic: string, index: number) => {
        if (!editValue.trim()) return
        
        try {
            toast.loading("saving changes..")
            const allowedQuestion = editAllowedQuestion ? parseInt(editAllowedQuestion) : 0
            const success = await updateTopic(courseId, oldTopic, editValue, allowedQuestion)
            
            if (success) {
                const updatedTopics = await getTopics(courseId)
                setTopics(updatedTopics)
                setEditingIndex(null)
                setEditValue("")
                setEditAllowedQuestion('')
                toast.success('Saved changes')
            }
        } catch (error) {
            console.error('Failed to edit topic:', error)
            toast.error('Failed to save changes')
        } finally {
            toast.dismiss()
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



    return (
        <>
        <section className="flex gap-4">
        <div className="space-y-4 flex-1 pb-32 overflow-x-hidden overflow-y-scroll max-h-[530px] relative">
                <div className="flex text-sm items-center gap-2.5 max-w-3xl sticky top-0 z-50 bg-white">
                    <p className="w-[38px]"></p>
                    <p className={`font-bold  ${editingIndex === null ? 'flex-[0.84] ' : 'flex-[3.8]'}`}>Topics</p>
                    <p className={`font-bold  flex-1`}>Allowed Qs</p>
                </div>
                {topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2 max-w-3xl ">
                        <div
                            className={`aspect-square rounded-md h-[38px] border-2 border-neutral-800 cursor-pointer flex items-center justify-center
                                ${selectedTopics.find(t => t.name === topic.name) ? 'bg-black' : 'bg-white'}`}
                            onClick={() => toggleTopicSelection(topic)}
                        />
                        {editingIndex === index ? (
                            <div className="flex items-center gap-2 w-full">
                                <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="Edit topic"
                                    className="border-neutral-800 border-2"
                                />
                                <Input
                                    type="number"
                                    value={editAllowedQuestion}
                                    onChange={(e) => setEditAllowedQuestion(e.target.value)}
                                    placeholder="Allowed Questions"
                                    className="w-28 min-w-28 border-neutral-800 border-2"
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
                                    <Input value={topic.name} disabled className="border-neutral-700 border-2  disabled:opacity-90"/>
                                    <Input 
                                        value={topic.allowedQuestion ?? 0} 
                                        disabled 
                                        className="w-24 border-neutral-700 border-2 disabled:text-neutral-900 disabled:opacity-90" 
                                    />
                                    
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
                                    <div className=" w-24 py-1.5 border-neutral-700 border-2 disabled:text-neutral-900 disabled:opacity-90 flex items-center justify-center rounded-md bg-muted">
                                        {topic.questionCount} Q
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                <div className="flex items-center gap-2 max-w-3xl">
                    <Input
                        value={newInput}
                        onChange={(e) => setNewInput(e.target.value)}
                        placeholder="Add new topic"
                        className="border-neutral-600 border-2 disabled:text-neutral-900 disabled:opacity-90"
                    />
                    <Input
                        type="number"
                        value={newAllowedQuestion}
                        onChange={(e) => setNewAllowedQuestion(e.target.value)}
                        placeholder="Allowed Questions"
                        className="w-48 min-w-48 border-neutral-600 border-2 disabled:text-neutral-900 disabled:opacity-90"
                    />
                    <Button size="icon" onClick={() => handleSave(newInput, newAllowedQuestion)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <section className='w-fit h-fit flex flex-col justify-end gap-4  '>
                <QuestionPaperDropdown topicsData={topicsData} open={dialogOpen} userId={user?.id} setOpen={setDialogOpen} />
                <Button
                    onClick={handleGenerateQuestionPaperClick}
                    className='bg-primary text-white self-end px-4 py-2 rounded-md'
                >
                    <p className="text-sm">Generate Question paper</p> 
                </Button>
                <Link
                    href={`/dashboard/question-bank/qps`}
                    className='bg-primary text-white self-end text-center px-4 py-2 rounded-md'
                >
                          
                    <span className="text-sm">Previous Question paper</span> 
                </Link>
            </section>
            
        </section>
           
        </>
    )
} 