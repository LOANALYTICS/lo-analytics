'use client'

import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TopicData } from '@/types/question-bank'
import { createQuestionPaper, generateQuestionsByPaperId, getPaperDetails } from "@/services/question-bank/generate-qp.service"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { getCurrentUser, UserJwtPayload } from '@/server/utils/helper'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TopicRow {
    id: string;
    topicName: string;
    allowedQuestion: number;
    clos: Record<string, number | null>;
    total: number;
}

interface GenerateQuestionTableProps {
    topics: TopicData[];
    courseId: string;
}

export function GenerateQuestionTable({ topics, courseId }: GenerateQuestionTableProps) {
    const [examName, setExamName] = useState<string>('')
    const [cloCount, setCloCount] = useState(3)
    const router = useRouter()
    const [selectedYear, setSelectedYear] = useState<string>("");

    const handleYearChange = async (value: string) => {
        setSelectedYear(value);
        
        try {
            const topicCounts = await getPaperDetails(courseId, value);
            console.log(topicCounts, 'topicCounts')
            // Reset table data with original values first
            setTableData(prev => prev.map((row, index) => ({
                id: `${index + 1}`,
                topicName: row.topicName,
                allowedQuestion: topics.find(t => t.name === row.topicName)?.allowedQuestion || 0,
                clos: Object.fromEntries([...Array(cloCount)].map((_, i) => [`clo${i + 1}`, null])),
                total: 0
            })));

            // Then update with remaining counts if they exist
            setTableData(prev => prev.map(row => {
                const topicCount = topicCounts.find(tc => tc.topic === row.topicName);
                return {
                    ...row,
                    allowedQuestion: topicCount?.remainingAllowed ?? 
                        topics.find(t => t.name === row.topicName)?.allowedQuestion ?? 0,
                    clos: Object.fromEntries([...Array(cloCount)].map((_, i) => [`clo${i + 1}`, null])),
                    total: 0
                };
            }));
            
        } catch (error) {
            console.error(error);
        }
    };
    const [user, setUser] = useState<UserJwtPayload>({
        _id: "",
        email: "",
        name: "",
        role: "",
        cid: "",
        permissions: []
    })
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser()
            if (user) {
                setUser({
                    ...user,
                    _id: user.id
                })
            }
        }
        fetchUser()
    }, [])
    const [tableData, setTableData] = useState<TopicRow[]>(() =>
        topics.map((topic, index) => ({
            id: `${index + 1}`,
            topicName: topic.name,
            allowedQuestion: topic.allowedQuestion,
            clos: Object.fromEntries([...Array(cloCount)].map((_, i) => [`clo${i + 1}`, null])),
            total: 0
        }))
    )

    const addNewClo = () => {
        const newCloKey = `clo${cloCount + 1}`
        setCloCount(prev => prev + 1)

        setTableData(prev => prev.map(row => ({
            ...row,
            clos: {
                ...row.clos,
                [newCloKey]: null
            }
        })))
    }


    const updateCLO = (rowId: string, clo: string, value: string) => {
        const numValue = value === '' ? null : parseInt(value)

        setTableData(prev => prev.map(row => {
            if (row.id === rowId) {
                const newClos = {
                    ...row.clos,
                    [clo]: numValue
                }
                // Explicitly type the reduce function to return number
                const total: number = Object.values(newClos).reduce((sum: number, val) => sum + (val ?? 0), 0)

                return {
                    ...row,
                    clos: newClos,
                    total
                }
            }
            return row
        }))
    }

    const handleGenerate = async () => {
        if (!examName.trim()) {
            toast.error('Please enter an exam name')
            return
        }
        if (!selectedYear.trim()) {
            toast.error('Please select a year')
            return
        }

        // Validate total questions per topic against allowed questions
        const invalidTopics = tableData.filter(row => row.total > row.allowedQuestion);
        if (invalidTopics.length > 0) {
            toast.error(
                `Cannot exceed allowed questions for topics: ${invalidTopics
                    .map(topic => `${topic.topicName} (max: ${topic.allowedQuestion})`)
                    .join(', ')}`
            );
            return;
        }

        try {
            const result = await createQuestionPaper({
                examName,
                courseId,
                topicQuestions: tableData.map(row => ({
                    topic: row.topicName,
                    clos: Object.fromEntries(
                        Object.entries(row.clos)
                            .filter(([_, value]) => value !== null)
                            .map(([key, value]) => [key, value as number])
                    ),
                    total: row.total
                }))
            }, user?._id, selectedYear)

            router.push(`/dashboard/question-bank/qps`)
            toast.success('Question paper structure created successfully')
        } catch (error) {
            toast.error('Failed to create question paper')
            console.error(error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Enter Exam Name"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="max-w-lg w-full min-w-md"
                    />
                    <Select
                        onValueChange={handleYearChange}
                        value={selectedYear}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={"2020-2021"}>2020-2021</SelectItem>
                            <SelectItem value={"2021-2022"}>2021-2022</SelectItem>
                            <SelectItem value={"2022-2023"}>2022-2023</SelectItem>
                            <SelectItem value={"2023-2024"}>2023-2024</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleGenerate}>
                    Generate
                </Button>

            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">S.No</TableHead>
                            <TableHead>Topic Name</TableHead>
                            <TableHead>Allowed Questions</TableHead>
                            {[...Array(cloCount)].map((_, index) => (
                                <TableHead key={`clo${index + 1}`} className="relative">
                                    CLO{index + 1}
                                    {index === cloCount - 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -right-2 top-1/2 transform -translate-y-1/2"
                                            onClick={addNewClo}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableHead>
                            ))}
                            <TableHead>Total Questions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.map((row, index) => (
                            <TableRow key={row.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{row.topicName}</TableCell>
                                <TableCell>{row.allowedQuestion}</TableCell>
                                {Object.keys(row.clos).map((clo) => (
                                    <TableCell key={clo}>
                                        <Input
                                            type="number"
                                            value={row.clos[clo] ?? ''}
                                            onChange={(e) => updateCLO(row.id, clo, e.target.value)}
                                            className="w-20"
                                        />
                                    </TableCell>
                                ))}
                                <TableCell>{row.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 