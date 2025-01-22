"use client"
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThumbsUp } from 'lucide-react';
import { generatePDF } from '@/services/PdfGeneratorService';
import { toast } from 'sonner';
import { getCoursesBySemester } from '@/services/courses.action';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { compareKRValues } from '@/services/compareKRValues.action';
import { generateComparisonHTML } from '@/services/CompareKRHTML';
import axios from 'axios';

export default function CourseCard({ cardOf, href, template, user }: { 
  cardOf?: string,
  href?: string, 
  template: any,
  user?: any 
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [semesterCourses, setSemesterCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    if (compareOpen && template.semister) {
      const fetchSemesterCourses = async () => {
        try {
          const response = await getCoursesBySemester(
            template.semister, 
            template._id,
            template.course_name
          );
          if (response.success) {
            setSemesterCourses(response.data);
          }
        } catch (error) {
          console.error('Error fetching semester courses:', error);
          toast.error('Failed to fetch comparable courses');
        }
      };
      fetchSemesterCourses();
    }
  }, [compareOpen, template.semister, template._id, template.course_name]);

  const handleCompare = async () => {
    if (!selectedCourseId) {
        toast.error('Please select a course to compare with');
        return;
    }

    try {
        const response = await compareKRValues(template._id, selectedCourseId);
        
        if (response.success) {
          const htmlContent = generateComparisonHTML(response.data);
          await generatePDF(htmlContent, `kr-comparison-${template.course_name}.pdf`);
          toast.success('Comparison PDF generated successfully');
        }
        setCompareOpen(false);
    } catch (error) {
        console.error('Error comparing courses:', error);
        toast.error('Failed to generate comparison');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/kr-value/download/${template._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to download KR Report');
      }

      // Check content type to handle the response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const result = await response.json();
        toast.error(result.error || 'Failed to download KR Report');
      } else {
        const htmlContent = await response.text();
        await generatePDF(htmlContent, `${template.course_code} - Item Analysis Report.pdf`);
        toast.success('KR Report downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading KR Report:', error);
      toast.error('Failed to download KR Report');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setLoading(true);
      setProgress(0);

      const fakeProgressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(fakeProgressInterval);
            setLoading(false);
            return 100;
          }
          return prevProgress + 10;
        });
      }, 50);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("collageId", user?.cid);
    formData.append("courseId", template._id);

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
        console.log("File uploaded successfully:", result);
      } else {
        const htmlContent = await response.text();
        await generatePDF(htmlContent, "analysis-report.pdf");
        toast.success("PDF generated successfully");
      }
      setUploadOpen(false);
      setSelectedFile(null);
      setProgress(0);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };


  return (
    <main className='w-full h-full'>
      {href ? (
        <Link
          href={href}
          className='flex relative justify-between items-center border border-gray-300 shadow-sm p-3 rounded-md text-[13px]'
        >
            <div className='flex flex-col gap-1'>
              <h2>Course Name : <span className='capitalize'>{template.course_name}</span></h2>
              <p>Course Code : <span className='capitalize'>{template.course_code}</span></p>
              <p>Section : <span className='capitalize'>{template.section}</span></p>
              <p>Type : <span className='capitalize'>{template.examType}</span></p>
              <p>Sem : <span className='capitalize'>{href ?  template.sem : template.semister}</span></p>
            </div>
            {cardOf === 'assessment-plan' && (
              <div className='absolute right-3 bottom-3 space-x-2'>
                <Button variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                Generate Report
                </Button>
              </div>
            )}
        </Link>
      ) : (
        <>
          <div className='flex relative justify-between items-center border border-gray-300 shadow-sm p-3 rounded-md text-[13px]'>
            <div className='flex flex-col gap-1'>
              <h2>Course Name : <span className='capitalize'>{template.course_name}</span></h2>
              <p>Course Code : <span className='capitalize'>{template.course_code}</span></p>
              <p>Section : <span className='capitalize'>{template.section}</span></p>
              <p>Type : <span className='capitalize'>{template.examType}</span></p>
              <p>Sem : <span className='capitalize'>{href ?  template.sem : template.semister}</span></p>
              <p>Academic Year : <span className='capitalize'>{template.academic_year}</span></p>
            </div>
            <div className='absolute right-3 bottom-3 space-x-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='p-0 text-[11px] w-[74px] h-7'>
                      <p className={template.krValues ? "text-green-500" : "text-red-500"}>KR20 Report </p>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDownload}>
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUploadOpen(true)}>
                    Generate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant='outline' 
                size='sm' 
                className='p-0 text-[11px] w-[74px] h-7'
                onClick={() => setCompareOpen(true)}
              >
                Compare
              </Button>
            </div>
          </div>

          {/* File Upload Dialog */}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Generate KR Report - {template.course_name}</DialogTitle>
              </DialogHeader>
              
              {selectedFile ? (
                loading ? (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : (
                  progress === 100 && (
                    <div className='flex gap-1 items-center justify-center'>
                      <ThumbsUp size={20} />
                      <p className='font-semibold text-center'>File uploaded successfully</p>
                    </div>
                  )
                )
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label htmlFor={`dropzone-file-${template._id}`} className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    </div>
                    <input id={`dropzone-file-${template._id}`} type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}

              <DialogFooter className='w-full'>
                <Button className='w-full' variant={'outline'} onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button className='w-full' disabled={!selectedFile} onClick={handleUpload}>Generate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Comparison Dialog */}
          <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Compare Course Analysis</DialogTitle>
                </DialogHeader>
                
                <div className="flex gap-4 py-4">
                    <div className="flex flex-col flex-1">
                        <p className="text-sm font-medium">Current Course:</p>
                        <p className="h-10 capitalize rounded-md text-sm text-center flex items-center justify-start px-3 bg-slate-100">
                            {template.course_name} ({template.section}) - {template.academic_year} - {template.examType}
                        </p>
                    </div>
                    <div className="flex flex-col flex-1">
                        <p className="text-sm font-medium">Compare with:</p>
                        <Select
                            onValueChange={setSelectedCourseId}
                            value={selectedCourseId}
                        >
                            <SelectTrigger>
                                <SelectValue style={{textTransform: 'capitalize'}} placeholder="Select course to compare" />
                            </SelectTrigger>
                            <SelectContent>
                                {semesterCourses.length > 0 ? (
                                    semesterCourses.map((course) => (
                                        <SelectItem key={course._id} value={course._id} className='capitalize'>
                                            {course.course_name} - {course.section} ({course.academic_year}) - {course.examType}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="relative flex items-center justify-center py-2 px-2 text-sm text-muted-foreground">
                                        No comparable courses found
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setCompareOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCompare} disabled={!selectedCourseId}>
                        Compare
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
      )}
    </main>
  )
}
