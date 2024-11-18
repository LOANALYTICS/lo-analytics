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
import axios from 'axios'
const formSchema = z.object({
  course_name: z.string(),
  course_code: z.string().min(4, { message: "Password must be at least 4 characters" }),
  credit_hours: z.string(),
  department: z.string(),
  co_ordinator: z.string(),
})
export default function CreateCoursePage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          course_name: "",
          course_code: "",
          credit_hours:"",
          department: "",
          co_ordinator:""
        },
      })
     
      async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        const response = await axios.post("/api/course-template/create-course-template", values)
        console.log(response)
      }
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
              name="co_ordinator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Co-Ordinator</FormLabel>
                  <FormControl>
                    <Input placeholder="Co-Ordinator" {...field} />
                  </FormControl>
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