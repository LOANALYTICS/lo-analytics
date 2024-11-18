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
import { ThumbsUp } from 'lucide-react'
import { generatePDF } from '@/services/PdfGeneratorService'
import { createCourse } from '@/services/courses.action';
import { toast } from "sonner"

const formSchema = z.object({
  course_name: z.string().min(1, { message: "Course name is required" }),
  course_code: z.string().min(1, { message: "Course code is required" }),
  credit_hours: z.string().min(1, { message: "Credit hours is required" }),
  department: z.string({
    required_error: "Please select a department",
  }),
  examType: z.string({
    required_error: "Please select an exam type",
  }),
  semister: z.string().min(1, { message: "Semester is required" }),
  level: z.string().min(1, { message: "Level is required" }),
  section: z.string().min(1, { message: "Section is required" }),
  academic_year: z.string().min(1, { message: "Academic year is required" }),
  student_withdrawn: z.string(),
  student_absent: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export default function NewCoursePage() {
    const [open, setOpen] = useState(false)
    const dialogRef = useRef<any>(null)
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          course_name: "",
          course_code: "",
          credit_hours: "",
          department: "",
          examType: "",
          semister: "",
          level: "",
          section: "",
          academic_year: "",
          student_withdrawn: "",
          student_absent: "",
        },
      })
     
      const [isSubmitting, setIsSubmitting] = useState(false);

      const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createCourse(data);
            
            if (result) {
                toast.success("Course created successfully");
                setOpen(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create course");
        } finally {
            setIsSubmitting(false);
        }
      }
      const handleUpload = async () => {
        if (!selectedFile) {
          alert("Please select a file before uploading.");
          return;
        }
    
        const formData = new FormData();
        formData.append("file", selectedFile);
    
        try {
          const response = await fetch("http://localhost:3000/api/kr-value", {
            method: "POST",
            body: formData,
          });
    
          if (!response.ok) {
            throw new Error("Failed to upload file");
          }
          const htmlContent = await response.text();
          console.log(htmlContent)
          await generatePDF(htmlContent, 'item-analysis-report.pdf');
          const result = await response.json();
          console.log("File uploaded successfully:", result);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      };

      const [selectedFile, setSelectedFile] = useState(null);
      const [progress, setProgress] = useState(0);
      const [loading, setLoading] = useState(false);

      const handleFileChange = (e: any) => {
        const file = e.target.files[0];
        setSelectedFile(file);
    
        // Simulate a brief progress animation upon file selection
        setLoading(true);
        setProgress(0);
    
        const fakeProgressInterval = setInterval(() => {
          setProgress((prevProgress) => {
            if (prevProgress >= 100) {
              clearInterval(fakeProgressInterval);
              setLoading(false);
              return 100;
            }
            return prevProgress + 10; // Update by 10% per interval
          });
        }, 50); // Adjust this interval to control speed
      };
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="department-1">Department 1</SelectItem>
                      <SelectItem value="department-2">Department 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
              name="examType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
         
           
            <Button 
                type="submit" 
                className='w-full' 
                style={{marginTop:"20px"}}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Creating..." : "Add Course"}
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
    <div className="flex items-center justify-center w-full">

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
              <div className='flex flex-col '>
                <ThumbsUp size={40} className='mx-auto'/>
              <p className='font-semibold text-center'>File uploaded successfully</p>
              <p className='text-xs text-center'>click on add file to proceed with calculation</p>
              </div>
            )
           
          )
        ): (
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 ">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          </div>
          <input id="dropzone-file" type="file" onChange={handleFileChange} className="hidden" />
      </label>
        )
          
      }
   
</div>

  <DialogFooter className='w-full'>
    <Button className='w-full' variant={'outline'} onClick={() => setOpen(false)}>Cancel</Button>
    <Button className='w-full' onClick={handleUpload}>Add File</Button>
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