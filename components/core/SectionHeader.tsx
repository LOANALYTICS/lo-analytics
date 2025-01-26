import React from 'react'

export default function SectionHeader({courseDetails}: {courseDetails: any}) {
  if(!courseDetails) return null
  return (
    <div className='flex gap-12 items-center bg-blue-50 rounded-lg p-2'>
      <div className='flex flex-col '>
        <h1 className='text-xl font-bold capitalize'>{`${courseDetails.course_name} (${courseDetails.course_code}) `}</h1>
        <p className='text-sm text-muted-foreground'>{`Semester ${courseDetails.semister} - ${courseDetails.academic_year}`}</p>
      </div>
   
    </div>
  )
}
