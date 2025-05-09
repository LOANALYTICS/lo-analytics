"use client"

import * as React from "react"
import { ScanEye } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface DropdownMenuProps {
  options: string[]; 
  state: Record<string, boolean>; 
  handleCheckedChangeAction: (option: string, checked: boolean) => void; 
}

export function DynamicDropdownMenu({ options, state, handleCheckedChangeAction }: DropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
            <ScanEye className='w-4 h-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuSeparator />
        {options.map((option, index) => (
          <DropdownMenuCheckboxItem
            key={option + index}
            checked={state[option as keyof typeof state]}
            onCheckedChange={(checked: boolean) => handleCheckedChangeAction(option, checked)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
