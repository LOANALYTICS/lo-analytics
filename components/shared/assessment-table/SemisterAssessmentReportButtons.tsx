'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { academicYears } from '@/lib/utils/y'
import { getCurrentUser } from '@/server/utils/helper'
import { zodResolver } from '@hookform/resolvers/zod'
import { DockIcon, Loader2, BarChart3Icon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'



const formSchema = z.object({
  academic_year: z.string().min(1, "Academic year is required"),
  semester: z.coerce.number().min(1, "Semester is required"),
  section: z.string().min(1, "Section is required"),
});

type FormValues = z.infer<typeof formSchema>;




export default function SemisterAssessmentReportButtons() {
  const [isAssessReportOpen, setIsAssessReportOpen] = useState(false)
  const [isGradesDistributionOpen, setIsGradesDistributionOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
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

  const fetchGradesData = async (data: FormValues): Promise<string> => {
    const queryParams = new URLSearchParams({
      academic_year: data.academic_year,
      semester: data.semester.toString(),
      section: data.section,
    });

    const response = await fetch(`/api/courses-so-averages?${queryParams}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => null);
      throw new Error(errorResult?.message || "Failed to fetch grades data");
    }

    return response.text();
  };

  const generatePDFFromHTML = async (htmlContent: string, filename: string): Promise<void> => {
    try {
      // Parse the HTML document and extract the body content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract the CSS styles from the head
      const styles = Array.from(doc.head.querySelectorAll('style'))
        .map(style => style.textContent)
        .join('\n');

      // Get the body content
      const bodyContent = doc.body.innerHTML;


      // Create a container with the styles and body content
      const container = document.createElement("div");

      // Create a wrapper with all styles inline
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <style>
          ${styles}
          
          /* Fix for html2canvas rowspan/colspan issues */
          table {
            table-layout: fixed !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
          }
          
          /* Center ALL cells vertically and horizontally */
          td, th {
            vertical-align: middle !important;
            text-align: center !important;
            min-height: 20px !important;
            box-sizing: border-box !important;
            display: table-cell !important;
            position: relative !important;
          }
          
          /* Specific handling for rowspan/colspan cells */
          td[rowspan], th[rowspan] {
            vertical-align: middle !important;
            text-align: center !important;
          }
          
          td[colspan], th[colspan] {
            vertical-align: middle !important;
            text-align: center !important;
          }
          
          /* Override any existing alignment classes */
          .dept-name, .course-name-col {
            text-align: center !important;
            vertical-align: middle !important;
          }
        </style>
        ${bodyContent}
      `;

      container.appendChild(wrapper);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      document.body.appendChild(container);

      // console.log("Tables found:", container.querySelectorAll('table').length);
      // console.log("Pages found:", container.querySelectorAll('.front-page, .summary-page, .page').length);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // PDF options
      const opt = {
        margin: 5,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ["css", "legacy"]
        }
      };


      // Find all pages
      const pages = container.querySelectorAll('.front-page, .summary-page, .page');

      if (pages.length === 0) {
        throw new Error('No pages found in the HTML content');
      }

      // Create PDF using jsPDF directly
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;


        // Log table structure for debugging
        const tables = page.querySelectorAll('table');
        if (tables.length > 0) {
          const firstTable = tables[0];
          // console.log('First table rows:', firstTable.querySelectorAll('tr').length);
          // console.log('Rowspan elements:', firstTable.querySelectorAll('[rowspan]').length);
        }

        // Convert this page to canvas
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          ignoreElements: (element) => {
            // Don't ignore any elements
            return false;
          }
        });

        // Add new page if not the first one
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate dimensions to fit page
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - (margin * 2)));

        // Add watermark to each page
        pdf.saveGraphicsState();
        (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));

        const watermarkImg = new Image();
        watermarkImg.src = "/pdf_logo.png";

        pdf.addImage(
          watermarkImg,
          "PNG",
          pdf.internal.pageSize.width - 25, // 25mm from right
          pdf.internal.pageSize.height - 25, // 25mm from bottom
          15, // width in mm
          15 // height in mm
        );

        pdf.restoreGraphicsState();
      }

      // Save the PDF
      pdf.save(filename);

      console.log("PDF generated successfully with", pages.length, "pages");

      // Clean up
      document.body.removeChild(container);

    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const handleGradesDistribution = async (data: FormValues) => {
    setIsGeneratingPDF(true);
    try {
      const htmlContent = await fetchGradesData(data);
      const filename = `student-grades-distribution-${data.academic_year}-sem${data.semester}-${data.section}.pdf`;

      await generatePDFFromHTML(htmlContent, filename);

      toast.success("PDF downloaded successfully");
      setIsGradesDistributionOpen(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
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
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      "Generate PDF"
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
