'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopicData } from '@/types/question-bank'
import { getCoursesByCreator } from '../../../../services/courses.action'

export default function QuestionPaperDropdown({
    open, 
    setOpen, 
    userId,
    topicsData
}: {
    open: boolean, 
    setOpen: (open: boolean) => void, 
    userId: string,
    topicsData: TopicData[]
}) {
    
    const router = useRouter()
    const searchParams = useSearchParams()
    const courseCode = searchParams.get('course_code')
    
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                if (userId) {
                    const fetchedCourses = await getCoursesByCreator(userId)
                    setCourses(fetchedCourses.data)
                }
            } catch (error) {
                console.error("Failed to fetch courses:", error)
            } finally {
                setLoading(false)
            }
        }

        if (open) {
            fetchCourses()
        }
    }, [open, userId])

    const handleCourseSelect = (courseId: string) => {
        router.push(`/dashboard/question-bank/generate-qp?courseId=${courseId}&topics=${encodeURIComponent(JSON.stringify(topicsData))}`)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='w-[70%] h-fit min-w-[70%]'>
                <DialogHeader>
                    <DialogTitle>Select Course</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[500px] overflow-y-auto grid grid-cols-2 gap-2">
                    {loading ? (
                        <div className="text-center">Loading courses...</div>
                    ) : courses.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                            No courses found
                        </div>
                    ) : (
                        courses.filter((course) => course.course_code === courseCode).map((course) => (
                            <div
                                key={course._id}
                                className="w-full p-2 border rounded-md cursor-pointer justify-start"
                                onClick={() => handleCourseSelect(course._id)}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">{course.course_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {course.course_code}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                       academic year: {course.academic_year}
                                    </span>
                                </div>
                            </div>
                        ))
                       
                    )}

                </div>
            </DialogContent>
          
        </Dialog>
    )
}
