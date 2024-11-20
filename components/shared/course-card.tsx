import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'

export default function CourseCard({ href, template }: { href?: string, template: any }) {
  return (
    <main className='w-full h-full'>
      {
        href ? (
          <Link
          key={template._id}
          href={href}
          className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
        >
          <h2>{template.course_name}</h2>
        </Link>
        ): (
          <div className='flex relative justify-between items-center border border-gray-300 shadow-sm p-3 rounded-md text-[13px]'>
            <div className='flex flex-col gap-1 '>
              <h2>Course Name : <span className='capitalize'>{template.course_name}</span></h2>
              <p>Course Code : <span className='capitalize'>{template.course_code}</span></p>
              <p>Section : <span className='capitalize'>{template.section}</span></p>
              <p>Type : <span className='capitalize'>{template.examType}</span></p>
            </div>
            <div className='absolute right-3 bottom-3 space-x-2'>
              <Button variant='outline' size='sm' className=' p-0 text-[11px] w-[74px] h-7'>KR Report</Button>
              <Button variant='outline' size='sm' className=' p-0 text-[11px] w-[74px] h-7'>Compare</Button>
            </div>
           
          </div>
        )
      }
    </main>
   
  )
}
