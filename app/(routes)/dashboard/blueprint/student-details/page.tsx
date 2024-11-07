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
  {
    id: '3',
    studentId: 'ghi789',
    studentName: 'Bob Smith',
  },
  {
    id: '4',
    studentId: 'jkl012',
    studentName: 'Alice Johnson',
  }
]
export default function StudentDetailsPage() {
  return (
    <main>
       <StudentTable data={stumm} />
    </main>
  )
}
