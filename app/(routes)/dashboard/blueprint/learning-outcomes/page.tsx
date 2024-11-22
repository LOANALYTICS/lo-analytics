'use client'

import AssessmentTable from '@/components/shared/assessment-table/AssessmentTable'
import { Button } from '@/components/ui/button'

// Dummy data with the same structure as your MongoDB model will have
const dummyData = {
  assessments: [
    {
      id: '1',
      type: 'Quiz 1',
      clos: {
        clo1: [1, 2],
        clo2: [3, 4],
        clo3: [5, 6],
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
      },
      weight: 30
    }
  ]
}

export default function LearningOutcomesPage() {
  const handleSave = (data: any) => {
    // This is where you'll make your API call to save to MongoDB
    console.log('Saving data:', data);
  }

  return (
    <div className="space-y-4 p-4">
      <AssessmentTable 
        initialData={dummyData.assessments}
        onSave={handleSave}
      />
    </div>
  )
}