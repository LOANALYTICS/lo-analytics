import Link from 'next/link'
import React from 'react'

export default function CourseCard({href, template}: {href: string, template: any}) {
  return (
      <Link
            key={template._id}
           href={href}
            className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
          >
            <h2>{template.course_name}</h2>
          </Link>
  )
}
