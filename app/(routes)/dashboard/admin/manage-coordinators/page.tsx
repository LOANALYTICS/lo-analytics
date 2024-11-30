"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from "@/components/shared/MultiSelect"
import { IUser } from "@/server/models/user.model"
import { getUsersByRole, updatePermissions } from "@/services/users.actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCollage } from "@/services/collage.action"
import { Loader2 } from "lucide-react"

export default function ManageCoordinators() {
  const [coordinators, setCoordinators] = useState<IUser[]>([])
  const [colleges, setColleges] = useState<{ _id: string; english: string }[]>([])
  const [selectedCollege, setSelectedCollege] = useState<string>('all'); // State for selected college
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch coordinators and colleges
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const coordinatorData = await getUsersByRole("course_coordinator");
      const collegeData = await getCollage(); // Fetch colleges

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
    : coordinators.filter((coordinator:any) => coordinator.collage?._id?.toString() === selectedCollege);

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
      console.log(`Permissions updated for User ID ${coordinatorId}:`, selectedPermissions)
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
          <section className="flex flex-col gap-2 mt-4">
            {filteredCoordinators.map(coordinator => (
              <div
                key={coordinator._id}
                className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
              >
                <h2>{coordinator.name}</h2>
                <DynamicDropdownMenu
                  options={["Item Analysis", "Question Bank", "Learning Outcome"]}
                  state={dropdownState[coordinator._id] || {}} // Pass the state for this coordinator
                  handleCheckedChange={(option, checked) => 
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
