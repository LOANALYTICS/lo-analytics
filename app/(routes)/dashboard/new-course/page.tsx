"use client"
import React, { useRef, useState } from 'react'
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

const formSchema = z.object({
  course_name: z.string(),
  course_code: z.string().min(6, { message: "Password must be at least 6 characters" }),
  credit_hours: z.string(),
  department: z.string(),
  semister: z.string(),
  level: z.string(),
  section: z.string(),
  academic_year: z.string(),
  total_no_of_questions: z.string(),
  total_students: z.string(),
  student_withdrawn: z.string(),
  student_absent: z.string()
})
export default function NewCoursePage() {
    const [open, setOpen] = useState(false)
    const dialogRef = useRef<any>(null)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          course_name: "",
          course_code: "",
          credit_hours:"",
          department: "",
          semister: "",
          level: "",
          section:"",
          academic_year:"",
          total_no_of_questions: "",
          total_students: "",
          student_withdrawn: "",
          student_absent: ""
        },
      })
     
      function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        setOpen(true)
      }
    return (
        <section className='min-w-[400px] border shadow-sm rounded-lg py-4 px-6'>
          
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
          <div className=' grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2'>
          <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Department" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          <FormField
              control={form.control}
              name="course_name"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Course Name" {...field} />
                  </FormControl >
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
                    <Input placeholder="Course code" {...field} />
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
                    <Input placeholder="Credit hours" {...field} />
                  </FormControl>
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
                  <FormLabel>Semister</FormLabel>
                  <FormControl>
                    <Input placeholder="Semister" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder="Level" {...field} />
                  </FormControl >
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <FormControl>
                    <Input placeholder="Section" {...field} />
                  </FormControl>
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
        <SelectItem value={"2020-2021"}>2020-2021</SelectItem>
        <SelectItem value={"2021-2022"}>2021-2022</SelectItem>
        <SelectItem value={"2022-2023"}>2022-2023</SelectItem>
        <SelectItem value={"2023-2024"}>2023-2024</SelectItem>
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
              name="total_no_of_questions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Questions</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder="total questions" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          <FormField
              control={form.control}
              name="total_students"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Total Student Attended</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder="Total student" {...field} />
                  </FormControl >
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_withdrawn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Withdrawn</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder="Student withdrawn" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_absent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Absent</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder="Student absent" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

        
          </div> 
         
           
            <Button type="submit" className='w-full ' style={{marginTop:"20px"}}>Add Course</Button>
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
    <div className="flex items-center justify-center w-full">
    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 ">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" />
    </label>
</div>

  <DialogFooter className='w-full'>
    <Button className='w-full' variant={'outline'} onClick={() => setOpen(false)}>Cancel</Button>
    <Button className='w-full'>Add File</Button>
  </DialogFooter>
  </DialogContent>
</Dialog>
        </section>
      )
}



{/* <FormField
control={form.control}
name="collage_name"
render={({ field }) => (
  <FormItem>
    <FormLabel>Collage</FormLabel>
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select Collage" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="collage_092">Collage 092</SelectItem>
        <SelectItem value="collage_82">Collage 82</SelectItem>
        <SelectItem value="collage_23">Collage 23</SelectItem>
      </SelectContent>
    </Select>
 
    <FormMessage />
  </FormItem>
)}
/> */}