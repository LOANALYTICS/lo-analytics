"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from '@/components/shared/MultiSelect'
import { IUser } from '@/server/models/user.model'
import { getUsersByRole } from '@/services/users.actions'
import { toast } from "sonner"
import { assignCoordinatorsToCourse, getCoursesTemplates } from "@/services/courseTemplate.action"
import { getCollage } from "@/services/collage.action"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ManageCoordinators() {
  const [courses, setCourses] = useState<any[]>([])
  const [coordinators, setCoordinators] = useState<any>([])
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})
  const [colleges, setColleges] = useState<any[]>([])
  const [selectedCollege, setSelectedCollege] = useState<string | null>("all")

  const fetchData = async () => {
    console.log("Fetching courses and coordinators...") 
    const courseData = await getCoursesTemplates()
    const coordinatorData = await getUsersByRole("course_coordinator")
    const collegeData = await getCollage()
    console.log("Coordinators fetched:", coordinatorData)

    setCourses(courseData)
    setCoordinators(coordinatorData)
    setColleges(collegeData)

    // Initialize dropdown state for each course and pre-fill based on existing coordinators
    const initialState = courseData.reduce((acc: Record<string, Record<string, boolean>>, course: any) => {
      if (Array.isArray(course.coordinator)) {
        acc[course._id] = course.coordinator.reduce(
          (coordinatorAcc: Record<string, boolean>, coordinator: any) => {
            coordinatorAcc[coordinator.name] = true
            return coordinatorAcc
          },
          {}
        )
      } else {
        acc[course._id] = {}
      }
      return acc
    }, {})

    setDropdownState(initialState)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter courses based on selected college or show all if no college is selected
  const filteredCourses = selectedCollege !== "all"
    ? courses.filter(course => course.college?._id === selectedCollege)
    : courses // Show all courses if "All Colleges" is selected

  // Handle state change for a specific course's dropdown and assign coordinators
  const handleCheckedChange = async (courseId: string, coordinatorName: string, checked: boolean) => {
    setDropdownState(prevState => ({
      ...prevState,
      [courseId]: {
        ...prevState[courseId],
        [coordinatorName]: checked,
      },
    }))

    // Get the updated list of selected coordinators
    const updatedState = {
      ...dropdownState,
      [courseId]: {
        ...dropdownState[courseId],
        [coordinatorName]: checked,
      },
    }

    const selectedCoordinators = Object.keys(updatedState[courseId]).filter(key => updatedState[courseId][key])
    const selectedCoordinatorIds = coordinators
      .filter((coordinator: any ) => selectedCoordinators.includes(coordinator.name))
      .map((coordinator: any) => coordinator._id)

    try {
      if (selectedCoordinatorIds.length > 0) {
        console.log(selectedCoordinatorIds)
        await assignCoordinatorsToCourse(courseId, selectedCoordinatorIds)
        toast.success(`Successfully assigned coordinators to course ${courseId}`)
      } else {
        await assignCoordinatorsToCourse(courseId, [])
        toast.success(`Cleared coordinators for course ${courseId}`)
      }
    } catch (error) {
      toast.error(`Failed to update coordinators for course ${courseId}`)
    }
  }

  // Get list of coordinator names for each course filtered by college
  const courseCoordinators = (course: any) => {
    console.log("Filtering coordinators for course:", course); // Debug log for course
    const filteredCoordinators = coordinators
      .filter((coordinator: any) => 
        coordinator.collage && course.college && 
        coordinator.collage._id === course.college._id // Compare by college ID
      ); 
    console.log("Filtered coordinators:", filteredCoordinators); // Debug log for filtered coordinators
    return filteredCoordinators.map((coordinator: any) => coordinator.name); // Return only names
  }

  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg">Manage Courses - ( {filteredCourses.length} )</h1>
      
      <Select onValueChange={setSelectedCollege} defaultValue={selectedCollege || ""}>
        <SelectTrigger>
          <SelectValue placeholder="Select College" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Colleges</SelectItem>
          {colleges.map((college) => (
            <SelectItem key={college._id} value={college._id}>
              {college.english}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <section className="flex flex-col gap-2 mt-4">
        {filteredCourses.map((course) => (
          <div key={course._id} className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2">
            <h2>{course?.course_name}</h2>
            <DynamicDropdownMenu
              options={courseCoordinators(course)} // Pass the filtered list of coordinators to the dropdown
              state={dropdownState[course._id] || {}} // Pass the state for this course
              handleCheckedChange={(name, checked) =>
                handleCheckedChange(course._id, name, checked) // Handle state changes for this course
              }
            />
          </div>
        ))}
      </section>
    </main>
  )
}