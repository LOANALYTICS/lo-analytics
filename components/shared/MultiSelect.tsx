"use client"

import * as React from "react"
import { ScanEye, Check } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DropdownMenuProps {
  type?:string,
  options: string[]; 
  state: Record<string, boolean>; 
  handleCheckedChangeAction: (option: string, checked: boolean) => void; 
}

export function DynamicDropdownMenu({type, options, state, handleCheckedChangeAction }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <ScanEye className='w-4 h-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search tools..." />
          <CommandEmpty>{
            type === "tools" ? 
            "No tools found." : "No Coordinator found."
            }</CommandEmpty>
          <CommandGroup className="max-h-80 overflow-y-auto">
            {options.map((option,idx) => (
              <CommandItem
                key={`${option}-${idx}`}
                onSelect={() => {
                  handleCheckedChangeAction(option, !state[option])
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    state[option] ? "opacity-100" : "opacity-0"
                  )}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
