"use client"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { getCourseTemplateById } from '@/services/courseTemplate.action'
import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThumbsUp, Loader2 } from 'lucide-react'
import { generatePDF } from '@/services/PdfGeneratorService'
import { createCourse } from '@/services/courses.action';
import { toast } from "sonner"
import { getCurrentUser } from '@/server/utils/helper'
import { academicYears } from '@/lib/utils/y'

const formSchema = z.object({
    course_name: z.string(),
    course_code: z.string(),
    credit_hours: z.string(),
    department: z.string(),
    examType: z.string().min(1, { message: "Please select an exam type" }),
    semister: z.coerce.number().min(1, { message: "Semester is required" }),
    level: z.number().min(1, { message: "Level is required" }),
    section: z.string().min(1, { message: "Section is required" }),
    academic_year: z.string().min(1, { message: "Academic year is required" }),
})

type FormValues = z.infer<typeof formSchema>

export default function NewCoursePage() {
    const [selectedFile, setSelectedFile] = useState<any>();
    const [createdCourseId, setCreatedCourseId] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null)
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const dialogRef = useRef<any>(null)
    const [isUploading, setIsUploading] = useState(false);

    // Check if src parameter is 'lc' - boolean variable
    const isFromLearningOutcomes = searchParams.get('src') === 'lc';

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            course_name: "",
            course_code: "",
            credit_hours: "",
            department: "",
            examType: isFromLearningOutcomes ? "final":"",
            semister: 0,
            level: 0,
            section: "",
            academic_year: "",
        },
    })

    useEffect(() => {

        async function loadCourseTemplate() {
            const user = await getCurrentUser()

            if (!params.tempId) {
                setIsLoading(false)
                return
            }

            try {
                const template = await getCourseTemplateById(params.tempId as string)
                if (template) {
                    form.reset({
                        course_name: template.course_name ?? "",
                        course_code: template.course_code ?? "",
                        credit_hours: template.credit_hours ?? "",
                        department: template.department ?? "",
                        examType: isFromLearningOutcomes ? 'final' : template.examType ?? "",
                        semister: template.sem ?? "",
                        level: template.level ?? "",
                        section: template.section ?? "",
                        academic_year: template.academic_year ?? "",
                    })
                    setUser(user)
                } else {
                    toast.error("Template not found")
                    router.push('/dashboard/admin/create-course')
                    setUser(user)
                }
            } catch (error) {
                console.error('Error loading template:', error)
                toast.error("Error loading template")
            } finally {
                setIsLoading(false)
            }
        }

        loadCourseTemplate()
    }, [params.tempId, form, router])

    const onSubmit = async (data: FormValues) => {
        const isEmpty = Object.values(data).some(value => !value);
        if (isEmpty) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createCourse({
                ...data,
                collage: user?.cid,
                createdBy: user?.id
            });

            if (!response || !response.success) {
                // Handle specific duplicate course error
                if (response.error.includes('already exists')) {
                    toast.warning(response.error, {
                        duration: 4000,
                        description: "Please try with different semester, section, or exam type"
                    });
                    return;
                }

                toast.error(response.error);
                return;
            }

            toast.success("Course created successfully");
            setCreatedCourseId(response.data._id);
            if(!isFromLearningOutcomes){

                setOpen(true);
            }else{
                router.push('/dashboard/learning-outcomes/assessment-plan')
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while creating the course");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">
            Loading...
        </div>
    }


    const handleFileChange = (e: any) => {
        const file = e.target.files[0];
        setSelectedFile(file);

        // Simulate a brief progress animation upon file selection
        setLoading(true);
        setProgress(0);

        const fakeProgressInterval = setInterval(() => {
            setProgress((prevProgress: any) => {
                if (prevProgress >= 100) {
                    clearInterval(fakeProgressInterval);
                    setLoading(false);
                    return 100;
                }
                return prevProgress + 10; // Update by 10% per interval
            });
        }, 50); // Adjust this interval to control speed
    };


    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file before uploading.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("courseId", createdCourseId);
        formData.append("collageId", user?.cid);

        try {
            const response = await fetch("/api/kr-value", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload file");
            }

            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const result = await response.json();
            } else {
                const htmlContent = await response.text();
                await generatePDF(htmlContent, `${form.watch("course_code")} - Item Analysis Report.pdf`);
                toast.success("Report downloaded successfully");
            }
            router.push(`/dashboard/item-analysis`);
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };


    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.type === "application/vnd.ms-excel")) {
            setSelectedFile(file);
            setProgress(0);

            const fakeProgressInterval = setInterval(() => {
                setProgress((prevProgress) => {
                    if (prevProgress >= 100) {
                        clearInterval(fakeProgressInterval);
                        return 100;
                    }
                    return prevProgress + 10;
                });
            }, 50);
        } else {
            toast.error('Please upload only Excel files (.xlsx, .xls)');
        }
    };
    return (
        <section className='min-w-[400px] border shadow-sm rounded-lg py-4 px-6'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2'>
                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled className="bg-gray-100" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="course_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Course Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled className="bg-gray-100" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="course_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Course Code</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled className="bg-gray-100" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="credit_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Credit Hours</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled className="bg-gray-100" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className=' grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2'>
                        <FormField
                            control={form.control}
                            name="semister"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Semester</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Semester" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">First Semester</SelectItem>
                                            <SelectItem value="2">Second Semester</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Level</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value?.toString()} // Keep the current value
                                    >
                                        <FormControl>
                                            <SelectTrigger disabled>
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[...Array(20)].map((_, index) => {
                                                const level = index + 1;
                                                const semester = form.watch("semister");
                                                // Render odd levels for semester 1 and even levels for semester 2
                                                if ((semester === 1 && level % 2 === 1) ||
                                                    (semester === 2 && level % 2 === 0)) {
                                                    return (
                                                        <SelectItem key={level} value={level.toString()}>
                                                            Level {level}
                                                        </SelectItem>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="section"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Section" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="academic_year"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Academic Year</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {academicYears.map((year: string) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className=' grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2'>
                        <FormField
                            control={form.control}
                            name="examType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Exam Type</FormLabel>
                                    <Select  onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger disabled={isFromLearningOutcomes}>
                                                <SelectValue placeholder="Select Exam Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="mid-term">Mid Term</SelectItem>
                                            <SelectItem value="final">Final</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button
                        type="submit"
                        className='w-full'
                        style={{ marginTop: "20px" }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner"></span>
                                Creating...
                            </>
                        ) : (
                            "Add Course"
                        )}
                    </Button>
                </form>
            </Form>

            <Dialog open={open} onOpenChange={setOpen} >
                <DialogContent
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Add file</DialogTitle>
                    </DialogHeader>
                    {

                        selectedFile ? (
                            loading ? (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            ) : (
                                progress === 100 && (
                                    <div className='flex gap-1 items-center justify-center'>
                                        <ThumbsUp size={20} className='' />
                                        <p className='font-semibold text-center'>File uploaded successfully</p>
                                    </div>
                                )

                            )
                        ) : (
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 "
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                        </svg>
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    </div>
                                    <input id="dropzone-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )

                    }







                    <DialogFooter className='w-full'>
                        <Button className='w-full' variant={'outline'} onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            className='w-full'
                            disabled={!selectedFile || isUploading}
                            onClick={handleUpload}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Add File"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
