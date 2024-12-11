'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TopicData {
    name: string;
    allowedQuestion: number;
}

interface TopicRow {
    id: string;
    topicName: string;
    allowedQuestion: number;
    clos: {
        clo1: number | null;
        clo2: number | null;
        clo3: number | null;
    };
    total: number;
}

interface GenerateQuestionTableProps {
    topics: TopicData[];
    courseId: string;
}

export function GenerateQuestionTable({ topics, courseId }: GenerateQuestionTableProps) {
    const [examName, setExamName] = useState<string>('')
    const [tableData, setTableData] = useState<TopicRow[]>(() => 
        topics.map((topic, index) => ({
            id: `${index + 1}`,
            topicName: topic.name,
            allowedQuestion: topic.allowedQuestion,
            clos: {
                clo1: null,
                clo2: null,
                clo3: null
            },
            total: 0
        }))
    )

    const updateCLO = (rowId: string, clo: keyof TopicRow['clos'], value: string) => {
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

    const handleGenerate = () => {
        if (!examName.trim()) {
            alert('Please enter an exam name')
            return
        }

        const result = {
            examName,
            topicQuestions: tableData.map(row => ({
                topic: row.topicName,
                clos: row.clos,
                total: row.total
            }))
        }

        console.log('Generated Question Paper Structure:', result)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <Input
                    placeholder="Enter Exam Name"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="max-w-md"
                />
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
                            <TableHead>CLO1</TableHead>
                            <TableHead>CLO2</TableHead>
                            <TableHead>CLO3</TableHead>
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
                                            value={row.clos[clo as keyof TopicRow['clos']] ?? ''}
                                            onChange={(e) => updateCLO(row.id, clo as keyof TopicRow['clos'], e.target.value)}
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