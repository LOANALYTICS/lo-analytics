"use client"
import React from 'react'
import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import { getCollage } from "@/services/collage.action";
import axios from 'axios'
import { useRouter } from "next/navigation"
import { toast } from 'sonner'

const formSchema = z.object({
  course_name: z.string(),
  course_code: z.string().min(4, { message: "Password must be at least 4 characters" }),
  credit_hours: z.string(),
  department: z.string(),
  sem: z.number(),
  level: z.number(),
  college: z.string(),
})
export default function CreateCoursePage() {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          course_name: "",
          course_code: "",
          credit_hours:"",
          department: "",
          sem: 1,
          level: 1,
          college: "",
        },
      })
     
      async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            console.log("Submitting values:", values);
            const response = await axios.post("/api/course-template/create-course-template", values)
            
            if (response.status === 201) {
                toast(
                    "Course template created successfully",
                )
                form.reset()
                router.refresh()
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast(
                   "A course with this name or code already exists",
                )
            } else {
                toast("Something went wrong. Please try again.",
                )
                console.error("Error details:", error.response?.data);
            }
        }
      }

      // Fetch colleges
      interface College {
        _id: string;
        english: string;
      }

      const [colleges, setColleges] = React.useState<College[]>([]);
      React.useEffect(() => {
        const fetchColleges = async () => {
          const collegeData = await getCollage();
          setColleges(collegeData);
        };
        fetchColleges();
      }, []);

    return (
        <section className='min-w-[400px] border shadow-sm rounded-lg py-4 px-6'>
          
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        
          <div className=' grid grid-cols-3 gap-2'>
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
          <div className='grid grid-cols-2 gap-2'>
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
            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select College" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colleges.map((college) => (
                        <SelectItem key={college._id} value={college._id}>
                          {college.english} {/* Adjust based on the college model */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
           
            <Button type="submit" className='w-full ' style={{marginTop:"20px"}}>Create</Button>
          </form>
        </Form>
        </section>
      )
}



// <FormField
// control={form.control}
// name="collage_name"
// render={({ field }) => (
//   <FormItem>
//     <FormLabel>Collage</FormLabel>
//     <Select onValueChange={field.onChange} defaultValue={field.value}>
//       <FormControl>
//         <SelectTrigger>
//           <SelectValue placeholder="Select Collage" />
//         </SelectTrigger>
//       </FormControl>
//       <SelectContent>
//         <SelectItem value="collage_092">Collage 092</SelectItem>
//         <SelectItem value="collage_82">Collage 82</SelectItem>
//         <SelectItem value="collage_23">Collage 23</SelectItem>
//       </SelectContent>
//     </Select>
 
//     <FormMessage />
//   </FormItem>
// )}
// />