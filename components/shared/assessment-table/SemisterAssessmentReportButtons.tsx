'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { academicYears } from '@/lib/utils/y'
import { getCurrentUser } from '@/server/utils/helper'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, DockIcon, Loader2, SplitIcon, BarChart3Icon } from 'lucide-react'
import React, { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'


const formSchema = z.object({
  academic_year: z.string().min(1, "Academic year is required"),
  semester: z.coerce.number().min(1, "Semester is required"),
  section: z.string().min(1, "Section is required"),
});

type FormValues = z.infer<typeof formSchema>;


export default function SemisterAssessmentReportButtons() {
  const [isAssessReportOpen, setIsAssessReportOpen] = useState(false)
  const [isGradesDistributionOpen, setIsGradesDistributionOpen] = useState(false)
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
    cid: any;
    permissions: string[];
  } | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getCurrentUser()
      setUser(result)
    }

    fetchUser()
  }, [])
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academic_year: "",
      semester: 1,
      section: "",
    },
  });

  const gradesForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academic_year: "",
      semester: 1,
      section: "",
    },
  });

  const handleAssessmentReport = async (data: FormValues) => {
    try {
      const response = await fetch('/api/generate-assess-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Handle Excel file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `semester-assessment-report-${data.academic_year}-sem${data.semester}-${data.section}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Report downloaded successfully");
        setIsAssessReportOpen(false);
      } else {
        // Try to parse error message
        try {
          const errorResult = await response.json();
          toast.error(errorResult.message || "Failed to generate report");
        } catch {
          toast.error("Failed to generate report");
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleGradesDistribution = async (data: FormValues) => {
    try {
      const response = await fetch('/api/courses-so-averages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Grades Distribution Data:", result);
        toast.success("Data retrieved successfully");
        setIsGradesDistributionOpen(false);
      } else {
        // Try to parse error message
        try {
          const errorResult = await response.json();
          toast.error(errorResult.message || "Failed to get grades distribution");
        } catch {
          toast.error("Failed to get grades distribution");
        }
      }
    } catch (error) {
      console.error("Grades distribution error:", error);
      toast.error("Failed to get grades distribution");
    }
  };


  return (
    <div>
      {
        user?.role === "college_admin" || user?.role === "admin" ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2 p-0 w-fit h-9 px-4"
              onClick={() => setIsAssessReportOpen(true)}
            >
              <span className="font-bold">Semester Assessment</span> <DockIcon className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 p-0 w-fit h-9 px-4"
              onClick={() => setIsGradesDistributionOpen(true)}
            >
              <span className="font-bold">Student Grades</span> <BarChart3Icon className="w-4 h-4" />
            </Button>

          </div>
        ) : null
      }
      <div>
        <Dialog open={isAssessReportOpen} onOpenChange={setIsAssessReportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assessment Report</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAssessmentReport)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                    </FormItem>
                  )}
                />


                <div className='flex items-center gap-3'>

                  <FormField

                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Semester</FormLabel>
                        <Select

                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger >
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
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Section</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                className='capitalize'
                                placeholder="Select Section"
                              >
                                {field.value ? field.value.charAt(0).toUpperCase() + field.value.slice(1) : "Select Section"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['all', 'male', 'female'].map((sem) => (
                              <SelectItem className='capitalize' key={sem} value={sem.toString()}>
                                {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                </div>


                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={false}
                  >
                    {false ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isGradesDistributionOpen} onOpenChange={setIsGradesDistributionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Student Grades Distribution</DialogTitle>
            </DialogHeader>
            <Form {...gradesForm}>
              <form
                onSubmit={gradesForm.handleSubmit(handleGradesDistribution)}
                className="space-y-4"
              >
                <FormField
                  control={gradesForm.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                    </FormItem>
                  )}
                />

                <div className='flex items-center gap-3'>
                  <FormField
                    control={gradesForm.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem className='flex-1'>
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
                    control={gradesForm.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Section</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                className='capitalize'
                                placeholder="Select Section"
                              >
                                {field.value ? field.value.charAt(0).toUpperCase() + field.value.slice(1) : "Select Section"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['all', 'male', 'female'].map((section) => (
                              <SelectItem className='capitalize' key={section} value={section.toString()}>
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={false}
                  >
                    {false ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Get Data"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

    </div >
  )
}
