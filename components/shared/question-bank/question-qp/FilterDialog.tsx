'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Filter } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { getFilteredQuestionPapers } from "@/services/question-bank/generate-qp.service"
import { getTopics } from "@/services/question-bank/question-bank.service"

interface CourseTemplate {
    _id: string;
    course_name: string;
    course_code: string;
}

interface FilterDialogProps {
    courseTemplates: CourseTemplate[];
}

interface TopicQuestion {
    topic: string;
    clos: Record<string, number>;
    total: number;
}

interface QuestionPaper {
    examName: string;
    topicQuestions: TopicQuestion[];
}

export function FilterDialog({ courseTemplates }: FilterDialogProps) {
    const [open, setOpen] = useState(false)
    const [showDistribution, setShowDistribution] = useState(false)
    const [selectedYear, setSelectedYear] = useState("")
    const [selectedCourse, setSelectedCourse] = useState<CourseTemplate | null>(null)
    const [topics, setTopics] = useState<any[]>([])
    const [papers, setPapers] = useState<any[]>([])

    const handleFilter = async () => {
        if (!selectedYear || !selectedCourse) {
            toast.error("Please select both year and course")
            return
        }

        try {
            const topicsData = await getTopics(selectedCourse._id);
            const result = await getFilteredQuestionPapers(selectedCourse.course_code, selectedYear);
            
            setTopics(topicsData);
            setPapers(result.data);
            setOpen(false);
            setShowDistribution(true);
        } catch (error) {
            toast.error("Failed to fetch data");
            console.error(error);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filter Question Papers</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2020-2021">2020-2021</SelectItem>
                                <SelectItem value="2021-2022">2021-2022</SelectItem>
                                <SelectItem value="2022-2023">2022-2023</SelectItem>
                                <SelectItem value="2023-2024">2023-2024</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={selectedCourse?.course_code}
                            onValueChange={(value) => setSelectedCourse(courseTemplates.find(c => c.course_code === value) || null)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courseTemplates.map((course) => (
                                    <SelectItem key={course._id} value={course.course_code}>
                                        {course.course_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleFilter}>
                                Generate
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDistribution} onOpenChange={setShowDistribution}>
                <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw]">
                    <DialogHeader>
                        <DialogTitle>Question Distribution for {selectedCourse?.course_name as string}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border p-2">S.No</th>
                                    <th className="border p-2">Topics</th>
                                    <th className="border p-2">Allowed Questions</th>
                                    <th className="border p-2">Exams</th>
                                    {Array.from(new Set(papers.flatMap(p => 
                                        p.topicQuestions.flatMap((tq: TopicQuestion) => Object.keys(tq.clos))
                                    ))).sort().map(clo => (
                                        <th key={clo} className="border p-2">CLO-{clo}</th>
                                    ))}
                                    <th className="border p-2">Total Q Per Test</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topics.map((topic, index) => (
                                    <tr key={topic.name}>
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2">{topic.name}</td>
                                        <td className="border p-2">{topic.allowedQuestion}</td>
                                        <td className="border p-2">
                                            <table className="w-full">
                                                <tbody>
                                                    {papers
                                                        .filter(paper => paper.topicQuestions
                                                            .some((tq: TopicQuestion) => tq.topic === topic.name))
                                                        .map(paper => (
                                                            <tr key={paper.examName}>
                                                                <td className="border-b p-1">{paper.examName}</td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </td>
                                        {Array.from(new Set(papers.flatMap(p => 
                                            p.topicQuestions.flatMap((tq: TopicQuestion) => Object.keys(tq.clos))
                                        ))).sort().map(clo => (
                                            <td key={clo} className="border p-2">
                                                <table className="w-full">
                                                    <tbody>
                                                        {papers
                                                            .filter(paper => paper.topicQuestions
                                                                .some((tq: TopicQuestion) => tq.topic === topic.name))
                                                            .map(paper => {
                                                                const topicQ = paper.topicQuestions
                                                                    .find((tq: TopicQuestion) => tq.topic === topic.name);
                                                                return (
                                                                    <tr key={paper.examName}>
                                                                        <td className="border-b p-1">
                                                                            {topicQ?.clos[clo] || '-'}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        }
                                                    </tbody>
                                                </table>
                                            </td>
                                        ))}
                                        <td className="border p-2">
                                            <table className="w-full">
                                                <tbody>
                                                    {papers
                                                        .filter(paper => paper.topicQuestions
                                                            .some((tq: TopicQuestion) => tq.topic === topic.name))
                                                        .map(paper => {
                                                            const topicQ = paper.topicQuestions
                                                                .find((tq: TopicQuestion) => tq.topic === topic.name);
                                                            return (
                                                                <tr key={paper.examName}>
                                                                    <td className="border-b p-1">
                                                                        {topicQ?.total || '-'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
} 