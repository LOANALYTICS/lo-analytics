"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CourseSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function CourseSearch({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search courses by name, code, department, or year..." 
}: CourseSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 w-full max-w-2xl min-w-80"
      />
    </div>
  );
}