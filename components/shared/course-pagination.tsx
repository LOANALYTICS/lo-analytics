"use client";

import { Button } from "@/components/ui/button";

interface CoursePaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export function CoursePagination({ 
  currentPage, 
  totalPages, 
  total,
  hasNext, 
  hasPrev, 
  onPageChange 
}: CoursePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-end items-center gap-2 mt-6">
      <Button
        variant="outline"
        size="xs"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={!hasPrev}
      >
        Previous
      </Button>
      
      <span className="text-xs text-gray-600">
        Page {currentPage} of {totalPages} ({total})
      </span>
      
      <Button
        variant="outline"
        size="xs"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
      >
        Next
      </Button>
    </div>
  );
}