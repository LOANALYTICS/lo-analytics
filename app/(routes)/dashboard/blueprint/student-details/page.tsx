import StudentTable from '@/components/shared/student-table/StudentTable'
import React from 'react'
const stumm = [
  {
    id: '1',
    studentId: 'abc123',
    studentName: 'John Doe',
  },
  {
    id: '2',
    studentId: 'def456',
    studentName: 'Jane Doe',
  },
 
]
export default function StudentDetailsPage() {
  return (
    <main>
       <StudentTable data={stumm} />
    </main>
  )
}
