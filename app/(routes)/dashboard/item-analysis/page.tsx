"use client"

import CourseCard from '@/components/shared/course-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DockIcon, SplitIcon, CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getCurrentUser } from '@/server/utils/helper';
import { getCoursesByCreator } from '@/services/courses.action';
import MigrateButton from '@/components/core/New';

// Form schema
const formSchema = z.object({
  academic_year: z.string().min(1, "Academic year is required"),
  semester: z.coerce.number().min(1, "Semester is required"),
  section: z.string().min(1, "Section is required"),
})

type FormValues = z.infer<typeof formSchema>

// Add this function at the top of the component or in a separate utility file
const generatePDF = async (html: string, fileName: string) => {
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
        marginTop: 0.5,
        marginBottom: 0.5
      },
      pagebreak: { 
        mode: 'avoid-all',
        after: '.table-wrapper',
        avoid: 'tr'
      }
    };

    // Special handling for year comparison
    if (fileName === 'year-comparison') {
      opt.pagebreak = { 
        mode: ['css', 'avoid-all'],
        before: '.table-wrapper'
      } as any;
      opt.html2canvas = {
        ...opt.html2canvas,
        windowHeight: container.scrollHeight
      } as any;
    }

    await html2pdf()
      .set(opt)
      .from(container)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          const pageHeight = pdf.internal.pageSize.height;
          const pageWidth = pdf.internal.pageSize.width;
          pdf.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - 0.5,
            pageHeight - 0.25,
            { align: 'right' }
          );
        }
      })
      .save();

    document.body.removeChild(container);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default function ItemAnalysisPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [yearCompareOpen, setYearCompareOpen] = useState(false);
  const [courses, setCourses] = useState<any>({ data: [] }); 
  const [user, setUser] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academic_year: "",
      semester: 1,
      section: "",
    },
  })

  const compareForm = useForm<{
    left: FormValues,
    right: FormValues
  }>({
    resolver: zodResolver(z.object({
      left: formSchema,
      right: formSchema
    })),
    defaultValues: {
      left: { academic_year: "", semester: 1, section: "" },
      right: { academic_year: "", semester: 1, section: "" }
    }
  });

  const yearCompareForm = useForm<{
    left: Omit<FormValues, 'section'>,
    right: Omit<FormValues, 'section'>
  }>({
    resolver: zodResolver(z.object({
      left: formSchema.omit({ section: true }),
      right: formSchema.omit({ section: true })
    })),
    defaultValues: {
      left: { academic_year: "", semester: 1 },
      right: { academic_year: "", semester: 1 }
    }
  });

  const onSubmit = async (data: FormValues) => {
    console.log(data);
    setFilterOpen(false);
  }

  const onCompareSubmit = async (data: { left: FormValues, right: FormValues }) => {
    try {
      const params = new URLSearchParams({
        collegeId: user?.cid,
        semister: data?.left?.semester.toString(),
        yearA: data?.left?.academic_year,
        yearB: data?.right?.academic_year,
        sectionA: data?.left?.section?.toLowerCase(),
        sectionB: data?.right?.section?.toLowerCase()
      });

      const response = await fetch(`/api/course-compare?${params}`);
      console.log(response, 'responsess');
      
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const htmlContent = await response.text();
      try {
        await generatePDF(htmlContent, 'item-analysis');
      } catch (error) {
        console.error('Failed to generate PDF:', error);
      }
      
      setCompareOpen(false);
    } catch (error) {
      console.error('Comparison error:', error);
      // You might want to add toast notification here for error handling
    }
  }

  const onYearCompareSubmit = async (data: { 
    left: Omit<FormValues, 'section'>, 
    right: Omit<FormValues, 'section'> 
  }) => {
    try {
      const params = new URLSearchParams({
        collegeId: user?.cid,
        semisterA: data?.left?.semester.toString(),
        semisterB: data?.right?.semester.toString(),
        yearA: data?.left?.academic_year,
        yearB: data?.right?.academic_year,
      });

      const response = await fetch(`/api/year-compare?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const htmlContent = await response.text();
      await generatePDF(htmlContent, 'year-comparison');
      setYearCompareOpen(false);
    } catch (error) {
      console.error('Year comparison error:', error);
    }
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
        <div className="flex gap-2">
          <Button 
            variant='outline' 
            className='flex items-center gap-2 p-0 w-20 h-9'
            onClick={() => setFilterOpen(true)}
          >
            <DockIcon className='w-4 h-4' />
          </Button>
          <Button 
            variant='outline' 
            className='flex items-center gap-2 p-0 w-20 h-9'
            onClick={() => setCompareOpen(true)}
          >
            <SplitIcon className='w-4 h-4' />
          </Button>
          <Button 
            variant='outline' 
            className='flex items-center gap-2 p-0 w-20 h-9'
            onClick={() => setYearCompareOpen(true)}
          >
            <CalendarIcon className='w-4 h-4' />
          </Button>
        </div>
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
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
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

      {/* Compare Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compare Semesters</DialogTitle>
          </DialogHeader>
          <Form {...compareForm}>
            <form onSubmit={compareForm.handleSubmit(onCompareSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Side */}
                <div className="space-y-4 border-r pr-4">
                  <h3 className="font-medium">Semester</h3>
                  <FormField
                    control={compareForm.control}
                    name="left.academic_year"
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
                    control={compareForm.control}
                    name="left.semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={compareForm.control}
                    name="left.section"
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
                            {['Male', 'Female'].map((section) => (
                              <SelectItem key={section} value={section}>
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Side */}
                <div className="space-y-4">
                  <h3 className="font-medium">Compare with </h3>
                  <FormField
                    control={compareForm.control}
                    name="right.academic_year"
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
                    control={compareForm.control}
                    name="right.semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={compareForm.control}
                    name="right.section"
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
                            {['Male', 'Female'].map((section) => (
                              <SelectItem key={section} value={section}>
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Compare</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Year Compare Dialog */}
      <Dialog open={yearCompareOpen} onOpenChange={setYearCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compare Years</DialogTitle>
          </DialogHeader>
          <Form {...yearCompareForm}>
            <form onSubmit={yearCompareForm.handleSubmit(onYearCompareSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Side */}
                <div className="space-y-4 border-r pr-4">
                  <h3 className="font-medium">Year A</h3>
                  <FormField
                    control={yearCompareForm.control}
                    name="left.academic_year"
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
                    control={yearCompareForm.control}
                    name="left.semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Side */}
                <div className="space-y-4">
                  <h3 className="font-medium">Year B</h3>
                  <FormField
                    control={yearCompareForm.control}
                    name="right.academic_year"
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
                    control={yearCompareForm.control}
                    name="right.semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Compare</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
