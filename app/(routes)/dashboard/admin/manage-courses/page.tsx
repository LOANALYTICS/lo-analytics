"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from '@/components/shared/MultiSelect'
import { IUser } from '@/server/models/user.model'
import { getUsersByRole, getUsersByCollegeId } from '@/services/users.actions'
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

interface College {
  _id: string;
  english: string;
}

interface CourseDisplay {
  _id: string;
  course_name: string;
  course_code: string;
  college: {
    _id: string;
    english: string;
  };
  coordinator: Array<{ _id: string; name: string; }>;
}

export default function ManageCoordinators() {
  const [courses, setCourses] = useState<CourseDisplay[]>([])
  const [coordinators, setCoordinators] = useState<IUser[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})

  const fetchData = async () => {
    const [courseData, coordinatorData, collegeData] = await Promise.all([
      getCoursesTemplates(),
      getUsersByRole("course_coordinator"),
      getCollage()
    ]);

    console.log('Course Data:', courseData);
    console.log('Coordinator Data:', coordinatorData);
    console.log('College Data:', collegeData);

    setCourses(courseData)
    setCoordinators(coordinatorData)
    setColleges(collegeData)

    // Initialize dropdown state
    const initialState = courseData.reduce((acc: Record<string, Record<string, boolean>>, course: any) => {
      acc[course._id] = {};
      return acc;
    }, {});

    setDropdownState(initialState)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <main className="px-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-semibold text-lg">Manage Courses - ( {courses.length} )</h1>
        <Select
          value={'all'}
          onValueChange={(value) => console.log(value)} // Placeholder for college selection
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by College" />
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
      </div>

      <section className="flex flex-col gap-2 mt-4">
        {courses.map((course) => {
          // Filter coordinators based on the college of the current course
          const courseCoordinators = coordinators.filter((coordinator: any) => 
            coordinator.collage?._id?.toString() === course.college._id.toString()
          );

          console.log(`Coordinators for ${course.course_name}:`, courseCoordinators); // Log for debugging

          return (
            <div key={course._id} className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2">
              <div>
                <h2 className="font-medium">
                  {course?.course_name} ({course?.college?.english})
                </h2>
                <p className="text-sm text-gray-500">
                  {course?.college?.english || 'No College Assigned'}
                </p>
              </div>
              <DynamicDropdownMenu
                options={courseCoordinators.map(coordinator => coordinator.name)} // Use coordinators filtered by the course's college
                state={dropdownState[course._id] || {}}
                handleCheckedChange={(name, checked) => {
                  console.log(`Changed ${name} to ${checked}`); // Placeholder for handling changes
                  // Update dropdown state if needed
                  setDropdownState(prev => ({
                    ...prev,
                    [course._id]: {
                      ...prev[course._id],
                      [name]: checked,
                    }
                  }));
                }}
              />
            </div>
          );
        })}
      </section>
    </main>
  )
}
