"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from "@/components/shared/MultiSelect"
import { IUser } from "@/server/models/user.model"
import { getUsersByRole, updatePermissions } from "@/services/users.actions"

export default function ManageCoordinators() {
  const [coordinators, setCoordinators] = useState<IUser[]>([])
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})

  // Fetch coordinators and initialize dropdown state
  useEffect(() => {
    const fetchCoordinators = async () => {
      const data = await getUsersByRole("course_coordinator")
      setCoordinators(data)

      // Initialize dropdown state for each coordinator based on their permissions
      const initialState = data.reduce((acc, coordinator) => {
        acc[coordinator._id] = {
          "Item Analysis": coordinator.permissions.includes("Item Analysis"),
          "Question Bank": coordinator.permissions.includes("Question Bank"),
          "Learning Outcome": coordinator.permissions.includes("Learning Outcome"),
        }
        return acc
      }, {} as Record<string, Record<string, boolean>>)

      setDropdownState(initialState)
    }

    fetchCoordinators()
  }, [])

  // Handle dropdown state changes dynamically
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
  }

  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg">Manage Coordinators - ( {coordinators.length} )</h1>
      <section className="flex flex-col gap-2 mt-4">
        {coordinators.map(coordinator => (
          <div
            key={coordinator._id}
            className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
          >
            <h2>{coordinator.name}</h2>
            <DynamicDropdownMenu
              options={["Item Analysis", "Question Bank", "Learning Outcome"]}
              state={dropdownState[coordinator._id] || {}} // Pass the state for this coordinator
              handleCheckedChange={(option, checked) =>
                handleCheckedChange(coordinator._id, option, checked) // Update state and server
              }
            />
          </div>
        ))}
      </section>
    </main>
  )
}
