"use client"
import React from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getCollageByRole, getCollegeById } from "@/services/collage.action"
import { getCourseById } from "@/services/courses.action"
import axios from 'axios'
import { useRouter } from "next/navigation"
import { toast } from 'sonner'
import { ObjectId } from 'mongoose'
import { editCourseTemplate, getCourseTemplateById } from '@/services/courseTemplate.action'

const formSchema = z.object({
  course_name: z.string(),
  course_code: z.string().min(4, { message: "Course code must be at least 4 characters" }),
  credit_hours: z.string(),
  department: z.string(),
  sem: z.number(),
  level: z.number(),
  college: z.string(),
})

export default function EditCoursePage({ params }: any) {
  const ClientParams = React.use<any>(params);
  const USER = JSON.parse(localStorage.getItem('user') || '{}')
  const router = useRouter()
  const [course, setCourse] = React.useState<any>(null)
  const [colleges, setColleges] = React.useState<any>([])
  const [departments, setDepartments] = React.useState<any>([])
  const [selectedCollege, setSelectedCollege] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_name: "",
      course_code: "",
      credit_hours: "",
      department: "",
      sem: 1,
      level: 1,
      college: "",
    },
  })

  // Fetch course data
  React.useEffect(() => {
    const fetchCourse = async () => {
      const courseData = await getCourseTemplateById(ClientParams.courseId)

      if (courseData) {
        setCourse(courseData)

        if (courseData.college) {
          setSelectedCollege(courseData.college)
          const collegeData = await getCollegeById(courseData.college)
          setDepartments(collegeData?.departments || [])
        }

        form.reset({
          course_name: courseData.course_name,
          course_code: courseData.course_code,
          credit_hours: courseData.credit_hours,
          department: courseData?.department,
          sem: courseData.sem,
          level: courseData.level,
          college: courseData?.college,
        })
      }
    }
    fetchCourse()
  }, [ClientParams.courseId])

  // Fetch colleges
  React.useEffect(() => {
    const fetchColleges = async () => {
      const collegeData = await getCollageByRole(USER?._id)
      setColleges(collegeData)
    }
    fetchColleges()
  }, [])


  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const rs  = await editCourseTemplate(ClientParams.courseId, values)
      if (!rs.success) {
        toast.error("something went wrong.")
        return
      }
      toast.success("Course updated successfully")
      router.push("/dashboard/admin/manage-courses")
    } catch (error: any) {
      toast("Something went wrong. Please try again.")
      console.error("Error details:", error.response?.data)
    } finally {
      setIsLoading(false)
    }
  }
  React.useEffect(() => {
    const subscription = form.watch((value) => {
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <section className='min-w-[400px] border shadow-sm rounded-lg py-4 px-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className='grid grid-cols-3 gap-2'>
            <FormField
              control={form.control}
              name="course_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Course Name" {...field}  />
                  </FormControl>
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
                    <Input placeholder="Course code" {...field}  />
                  </FormControl>
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
                    <Input placeholder="Credit hours" {...field}  />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="college"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College</FormLabel>
                <Select defaultValue={field.value} value={field.value}  disabled>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colleges.map((college: any) => (
                      <SelectItem key={college._id} value={college._id}>
                        {college.english}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid grid-cols-2 gap-2'>
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select defaultValue={field.value === '' ? course?.department : field.value} onValueChange={field.onChange} value={field.value === '' ? course?.department : field.value} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      
                      {departments.map((dept: any) => (
                        <SelectItem key={dept._id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i * 2 + (form.watch('sem') === 1 ? 1 : 2)).map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          Level {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className='w-full' style={{ marginTop: "20px" }} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </form>
      </Form>
    </section>
  )
}


