"use client";

import { CourseSearch } from "./course-search";

interface CourseHeaderProps {
  placeholder?: string;
  title: string;
  count: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  children?: React.ReactNode;
}

export function CourseHeader({ 
  placeholder,
  title, 
  count, 
  searchTerm, 
  onSearchChange, 
  children 
}: CourseHeaderProps) {
  return (
    <div className=" mb-2 flex items-center justify-between ">
      <CourseSearch 
        searchTerm={searchTerm} 
        onSearchChange={onSearchChange} 
        placeholder={placeholder}
      />
      <div className="flex text-nowrap justify-between items-center gap-3">
        <h1 className="font-semibold text-lg">
          {title} - ({count})
        </h1>
        {children}
      </div>
     
    </div>
  );
}