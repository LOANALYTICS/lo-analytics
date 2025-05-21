"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from "@/components/shared/MultiSelect"
import { IUser } from "@/server/models/user.model"
import { getUsersByRole, getUsersForManage, updatePermissions } from "@/services/users.actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCollage, getCollageByRole } from "@/services/collage.action"
import { Loader2, Mail } from "lucide-react"

export default function ManageCoordinators() {
  const USER = JSON.parse(localStorage.getItem('user') || '{}')
  const [coordinators, setCoordinators] = useState<IUser[]>([])
  const [colleges, setColleges] = useState<{ _id: string; english: string }[]>([])
  const [selectedCollege, setSelectedCollege] = useState<string>('all'); // State for selected college
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch coordinators and colleges
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const coordinatorData = await getUsersForManage(USER?._id);
      const collegeData = await getCollageByRole(USER?._id); // Fetch colleges

      setCoordinators(coordinatorData);
      setColleges(collegeData);




      // Initialize dropdown state for each coordinator based on their permissions
      const initialState = coordinatorData.reduce((acc, coordinator) => {
        acc[coordinator._id] = {
          "Item Analysis": coordinator.permissions.includes("Item Analysis"),
          "Question Bank": coordinator.permissions.includes("Question Bank"),
          "Learning Outcome": coordinator.permissions.includes("Learning Outcome"),
        }
        return acc
      }, {} as Record<string, Record<string, boolean>>)

      setDropdownState(initialState);
      setLoading(false);
    }

    fetchData();

  }, []);

  // Filter coordinators based on selected college
  const filteredCoordinators = selectedCollege === 'all'
    ? coordinators
    : coordinators.filter((coordinator: any) => coordinator.collage?._id?.toString() === selectedCollege);

  // Handle changes in the dropdown menu
  const handleCheckedChange = async (coordinatorId: string, option: string, checked: boolean) => {
    // Update local state
    const updatedState = {
      ...dropdownState,
      [coordinatorId]: {
        ...dropdownState[coordinatorId],
        [option]: checked,
      },
    }

    setDropdownState(updatedState)

    // Extract selected permissions
    const selectedPermissions = Object.entries(updatedState[coordinatorId])
      .filter(([, isSelected]) => isSelected)
      .map(([permission]) => permission)

    // Update permissions on the server
    try {
      await updatePermissions(coordinatorId, selectedPermissions)
    } catch (error) {
      console.error("Failed to update permissions:", error)
    }
  };

  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg">Manage Coordinators - ( {filteredCoordinators.length} )</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Select
              value={selectedCollege}
              onValueChange={(value) => setSelectedCollege(value)} // Update selected college
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges.map(college => (
                  <SelectItem key={college._id} value={college._id}>
                    {college.english}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]  gap-2 mt-4">
            {filteredCoordinators.map((coordinator: any) => (
              <div
                key={coordinator._id}
                className="flex relative justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
              >
                {
                  coordinator?.role === "college_admin" && (
                    <span className='bg-black px-2 py-0.5 rounded-md text-[10px] text-white absolute -top-2 right-2'>College Admin</span>

                  )
                }
                <div className="flex flex-col ">
                  <h2 className="font-medium">{coordinator.name}</h2>
                  <div className="text-gray-500 text-sm flex gap-1 items-center">
                    <Mail size={12} />
                    <h4>{coordinator.email}</h4>
                  </div>
                  <p className="text-xs text-gray-500">Accociated with college: {coordinator.collage?.english}</p>
                </div>
                <DynamicDropdownMenu
                  options={["Item Analysis", "Question Bank", "Learning Outcome"]}
                  state={dropdownState[coordinator._id] || {}} // Pass the state for this coordinator
                  handleCheckedChangeAction={(option, checked) =>
                    handleCheckedChange(coordinator._id, option, checked) // Call the handler with the coordinator ID
                  }
                />
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
