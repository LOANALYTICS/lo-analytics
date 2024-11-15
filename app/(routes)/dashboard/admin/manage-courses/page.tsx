"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from '@/components/shared/MultiSelect'
import { IUser } from '@/server/models/user.model'
import { assignCoordinatorsToCourse, getCourses } from '@/services/courses.action'
import { getUsersByRole } from '@/services/users.actions'

export default function ManageCoordinators() {
  const [courses, setCourses] = useState<any[]>([])
  const [coordinators, setCoordinators] = useState<IUser[]>([])
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    const fetchData = async () => {
      const courseData = await getCourses()
      const coordinatorData = await getUsersByRole("course_coordinator")
      setCourses(courseData)
      setCoordinators(coordinatorData)

      // Initialize dropdown state for each course
      const initialState = courseData.reduce(
        (acc: Record<string, Record<string, boolean>>, course: any) => {
          acc[course._id] = {}
          return acc
        },
        {}
      )
      setDropdownState(initialState)
    }

    fetchData()
  }, [])

  // Handle state change for a course's dropdown
  const handleCheckedChange = (courseId: string, coordinatorName: string, checked: boolean) => {
    setDropdownState((prevState) => ({
      ...prevState,
      [courseId]: {
        ...prevState[courseId],
        [coordinatorName]: checked,
      },
    }))
  }

  // Assign coordinators to a course when its dropdown state changes
  useEffect(() => {
    const assignCoordinators = async () => {
      for (const [courseId, coordinatorsState] of Object.entries(dropdownState)) {
        const selectedCoordinators = Object.keys(coordinatorsState).filter(
          (name) => coordinatorsState[name]
        )
        if (selectedCoordinators.length > 0) {
          const selectedCoordinatorIds = coordinators
            .filter((c) => selectedCoordinators.includes(c.name))
            .map((c) => c._id)
          await assignCoordinatorsToCourse(courseId, selectedCoordinatorIds)
        }
      }
    }
    assignCoordinators()
  }, [dropdownState, coordinators])

  // Get list of coordinator names
  const courseCoordinators = coordinators.map((coordinator) => coordinator.name)

  return (
    <main className='px-2'>
      <h1 className='font-semibold text-lg'>Manage Courses - ( {courses?.length} )</h1>
      <section className='flex flex-col gap-2 mt-4'>
        {courses.map((course) => (
          <div
            key={course._id}
            className='flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2'
          >
            <h2>{course?.course_name}</h2>
            <DynamicDropdownMenu
              options={courseCoordinators} // Pass the list of coordinator names
              state={dropdownState[course._id] || {}} // Pass the state for this course
              handleCheckedChange={(name, checked) =>
                handleCheckedChange(course._id, name, checked)
              } // Handle state changes for this course
            />
          </div>
        ))}
      </section>
    </main>
  )
}
