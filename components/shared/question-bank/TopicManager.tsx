"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Save, Trash2, Edit2, ReceiptPoundSterling, File } from "lucide-react"
import { useEffect, useState } from "react"
import { addTopic, deleteTopic, updateTopic, getTopics } from "@/services/question-bank/question-bank.service"
import { useRouter } from "next/navigation"

interface TopicManagerProps {
    courseId: string
}

export function TopicManager({ courseId }: TopicManagerProps) {
    const router = useRouter()
    const [topics, setTopics] = useState<string[]>([])
    const [newInput, setNewInput] = useState("")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState("")
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])

    useEffect(() => {
        const fetchTopics = async () => {
            const fetchedTopics = await getTopics(courseId)
            setTopics(fetchedTopics)
        }
        fetchTopics()
    }, [courseId])

    const handleSave = async (value: string) => {
        if (!value.trim()) return

        const newTopics = await addTopic(courseId, value)
        if (newTopics) {
            setTopics(newTopics)
            setNewInput("") // Clear input after save
        }
    }
    useEffect(() => {
        console.log(selectedTopics)
    }, [selectedTopics])

    const handleEdit = async (oldTopic: string, index: number) => {
        if (!editValue.trim()) return
        const success = await updateTopic(courseId, oldTopic, editValue)
        if (success) {
            const updatedTopics = await getTopics(courseId)
            setTopics(updatedTopics)
            setEditingIndex(null)
            setEditValue("")
        }
    }

    const handleDeleteTopic = async (topic: string) => {
        const success = await deleteTopic(courseId, topic)
        if (success) {
            const updatedTopics = await getTopics(courseId)
            setTopics(updatedTopics)
            setSelectedTopics(prev => prev.filter(t => t !== topic))
        }
    }

    const toggleTopicSelection = (topic: string) => {
        setSelectedTopics(prev => 
            prev.includes(topic) 
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
        )
    }

    const handleAddQuestions = (topicName: string) => {
        router.push(`/dashboard/question-bank/${courseId}/${encodeURIComponent(topicName)}`)
    }

    return (
        <div className="space-y-4">
            {topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-2 max-w-2xl">
                    <div
                        className={`aspect-square rounded-md h-[38px] border cursor-pointer flex items-center justify-center
                            ${selectedTopics.includes(topic) ? 'bg-black' : 'bg-white'}`}
                        onClick={() => toggleTopicSelection(topic)}
                    />
                    {editingIndex === index ? (
                        <div className="flex items-center gap-2 w-full">
                            <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Edit topic"
                            />
                            <Button
                                size="icon"
                                onClick={() => handleEdit(topic, index)}
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full group">
                            <Input value={topic} disabled />
                           <div className="flex items-center gap-2 ">
                           <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                    setEditingIndex(index)
                                    setEditValue(topic)
                                }}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteTopic(topic)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button> 
                            <Button
                                size="icon"
                                className="w-full"
                                variant="default"
                                onClick={() => handleAddQuestions(topic)}
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
                <Button size="icon" onClick={() => handleSave(newInput)}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
} 