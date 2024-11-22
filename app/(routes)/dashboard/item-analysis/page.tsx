"use client"
import CourseCard from '@/components/shared/course-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DockIcon } from 'lucide-react';
import { useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getCurrentUser } from '@/server/utils/helper';
import { getCoursesByCreator } from '@/services/courses.action';

// Form schema
const formSchema = z.object({
  academic_year: z.string().min(1, "Academic year is required"),
  semester: z.string().min(1, "Semester is required"),
})

type FormValues = z.infer<typeof formSchema>

export default function ItemAnalysisPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [courses, setCourses] = useState<any>({ data: [] }); 
  const [user, setUser] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academic_year: "",
      semester: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    console.log(data);
    setFilterOpen(false);
  }

  useEffect(() => {
    const getData = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser);
      const res = await getCoursesByCreator(currentUser?.id!)
      setCourses(res)
    }
    getData()
  }, [])

  return (
    <main className="px-2">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-lg">Courses - ({courses.data.length})</h1>
        <Button 
          variant='outline' 
          className='flex items-center gap-2 p-0 w-20 h-9'
          onClick={() => setFilterOpen(true)}
        >
          <DockIcon className='w-4 h-4' />
        </Button>
      </div>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 mt-4">
        {courses.data.map((template: any) => (
          <CourseCard 
            key={template._id} 
            template={template} 
            user={user}
          />
        ))}
      </section>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Semester Analysis</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectItem value="2020-2021">2020-2021</SelectItem>
                        <SelectItem value="2021-2022">2021-2022</SelectItem>
                        <SelectItem value="2022-2023">2022-2023</SelectItem>
                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...Array(8)].map((_, i) => (
                          <SelectItem key={i} value={`semester ${i + 1}`}>
                            Semester {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Generate</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
