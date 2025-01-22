'use client'

import AssessmentTable from '@/components/shared/assessment-table/AssessmentTable'
import { Button } from '@/components/ui/button'
import { getAssessmentByCourse, updateAssessmentPlans } from '@/services/assessment.action';
import { getCourseById } from '@/services/courses.action';
import { Loader2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Dummy data with the same structure as your MongoDB model will have
const dummyData = {
  assessments: [
    {
      id: '1',
      type: 'Quiz 1',
      clos: {
        clo1: [1, 2],
        clo2: [3, 4],
        clo3: [5],
        clo4: [6],
        clo5: [7],
      },
      weight: 10
    },
    {
      id: '2',
      type: 'Mid Term',
      clos: {
        clo1: [2, 3],
        clo2: [4, 5],
        clo3: [1, 6],
        clo4: [7],
        clo5: [8],
      },
      weight: 30
    }
  ]
}

export default function AssessmentPlanPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [assessmentData, setAssessmentData] = useState([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getAssessmentByCourse(courseId);
        const course = await getCourseById(courseId);

      
        console.log('API Response:', response);
        
        if (response.success && response.data?.assessments) {
          const formattedData = response.data.assessments.map((item: { id?: string; _id?: string; type: string; clos: any; weight: number }) => ({
            id: item.id || item._id?.toString(),
            type: item.type,
            clos: item.clos || {},
            weight: item.weight
          }));
          console.log('Formatted Data:', formattedData);
          setAssessmentData(formattedData);
          setCourse(course);
        }
      } catch (error) {
        console.error('Error fetching assessment:', error);
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
      if (!course?.academic_year || !course?.academic_year) {
        toast.error('Academic year not found');
        return;
    }
      const response = await updateAssessmentPlans(courseId,course.academic_year, data);
      if (response.success) {
        toast.success('Assessment plans updated successfully');
      } else {
        toast.error(response.message || 'Failed to update assessment plans');
      }
        setSaving(false);
    } catch (error: any) {
      console.error('Error saving:', error.message);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className='w-full h-1/3 flex justify-center items-center'><Loader2Icon className='animate-spin text-primary h-6 w-6'/></div>;
  }

  return (
    <div className="space-y-4 p-4">
      <AssessmentTable 
        saving={saving}
        initialData={assessmentData}
        onSave={handleSave}
      />
    </div>
  )
}