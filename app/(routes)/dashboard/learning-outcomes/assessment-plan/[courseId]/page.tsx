'use client'

import AssessmentTable from '@/components/shared/assessment-table/AssessmentTable'
import { Button } from '@/components/ui/button'
import { getAssessmentByCourse, updateAssessmentPlans } from '@/services/assessment.action';
import { getCourseById } from '@/services/courses.action';
import { getCLOData } from '@/services/blueprint/learning-outcome.action';
import { ThumbsUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SimpleLoader from '@/components/core/SimpleLoader';
import SectionHeader from '@/components/core/SectionHeader';
import IndirectAssessmentTable from '@/components/shared/assessment-table/IndirectAssessmentTable';
// Dummy data with the same structure as your MongoDB model will have


export default function AssessmentPlanPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [assessmentData, setAssessmentData] = useState([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numberOfClos, setNumberOfClos] = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingDialog, setLoadingDialog] = useState(false);

  const [selectedType, setSelectedType] = useState<string>('');
  const [tab, setTab] = useState<'direct' | 'indirect'>('direct')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assessmentResponse, courseResponse, cloData] = await Promise.all([
          getAssessmentByCourse(courseId),
          getCourseById(courseId),
          getCLOData(courseId)
        ]);
        
        setNumberOfClos(cloData?.length || 3);
        
        if (assessmentResponse.success && assessmentResponse.data?.assessments) {
          const formattedData = assessmentResponse.data.assessments.map((item: any) => ({
            id: item.id || item._id?.toString(),
            type: item.type,
            clos: item.clos || {},
            weight: item.weight
          }));
          setAssessmentData(formattedData);
     
        }
        setCourse(courseResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (!course?.academic_year) {
        toast.error('Academic year not found');
        return;
      }

      // Strict validation for CLOs
      const invalidAssessments = data.filter((assessment: any) => {
        // Check if clos exists and has at least one CLO with numbers
        return !assessment.clos || 
               Object.keys(assessment.clos).length === 0 || 
               Object.values(assessment.clos).every((numbers: any) => numbers.length === 0);
      });

      if (invalidAssessments.length > 0) {
        setSaving(false);
        toast.error(
          `Please configure CLOs with question numbers for: ${invalidAssessments.map((a: any) => a.type).join(', ')}`
        );
        return;
      }

      const response = await updateAssessmentPlans(courseId, course.academic_year, data);
      if (response.success) {
        toast.success('Assessment plans updated successfully');
      } else {
        toast.error(response.message || 'Failed to update assessment plans');
      }
    } catch (error: any) {
      console.error('Error saving:', error.message);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setLoadingDialog(true);
      setProgress(0);

      const fakeProgressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(fakeProgressInterval);
            setLoadingDialog(false);
            return 100;
          }
          return prevProgress + 10;
        });
      }, 50);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
                 file.type === "application/vnd.ms-excel")) {
      setSelectedFile(file);
      setLoadingDialog(true);
      setProgress(0);

      const fakeProgressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(fakeProgressInterval);
            setLoadingDialog(false);
            return 100;
          }
          return prevProgress + 10;
        });
      }, 50);
    } else {
      toast.error('Please upload only Excel files (.xlsx, .xls)');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !course) return;
    
    try {
      setLoadingDialog(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('courseId', course._id);
      formData.append('type', selectedType);

      const response = await fetch('/api/assessment-upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload assessment');
      }

      toast.success('Assessment uploaded successfully');
      setUploadOpen(false);
      setSelectedFile(null);
      setProgress(0);

    } catch (error) {
      console.error('Error uploading assessment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload assessment');
    } finally {
      setLoadingDialog(false);
    }
  };

  if (loading) {
    return <SimpleLoader />;
  }
  

  return (
    <div className="space-y-2 p-2">
      <div className='flex gap-12 items-center justify-between bg-blue-50 rounded-lg p-2'>
      <div className='flex flex-col '>
        <h1 className='text-xl font-bold capitalize'>{`${course.course_name} (${course.course_code}) `}</h1>
        <p className='text-sm text-muted-foreground'>{`${course.semister === 1 ? "First" : "Second"} Semester - ${course.academic_year}`}</p>
      </div>
      <div className='space-x-4'>
        <Button variant={tab === 'direct' ? 'outline' : 'default'} onClick={() => setTab('direct')}>
          Direct
        </Button>
        <Button variant={tab === 'indirect' ? 'outline' : 'default'} onClick={() => setTab('indirect')}>
          Indirect
        </Button>
      </div>
    </div>
     {
      tab === 'direct' ? (
        <AssessmentTable 
        courseId={courseId}
        saving={saving}
        initialData={assessmentData}
        onSave={handleSave}
        onUpload={(type: string) => {
          setSelectedType(type);
          setUploadOpen(true);
        }}
        numberOfClos={numberOfClos}
      />
      ): (
       <IndirectAssessmentTable numberOfClos={numberOfClos} courseId={courseId}/>
      )
     }

      
    {/* //drawers */}
    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Upload Assessment Report - {selectedType}</DialogTitle>
              </DialogHeader>
              
              {selectedFile ? (
                loadingDialog ? (
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
                  <label 
                    htmlFor={`dropzone-file-${course?._id}`} 
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    </div>
                    <input id={`dropzone-file-${course?._id}`} type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}

              <DialogFooter className='w-full'>
                <Button className='w-full' variant={'outline'} onClick={() => {
                  setUploadOpen(false);
                  setSelectedFile(null);
                  setProgress(0);
                }}>Cancel</Button>
                <Button className='w-full' disabled={!selectedFile} onClick={handleUpload}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </div>
  )
}