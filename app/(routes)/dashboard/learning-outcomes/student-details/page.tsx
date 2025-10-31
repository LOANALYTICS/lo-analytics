"use client";

import CourseCard from '@/components/shared/course-card';
import { getCurrentUser } from '@/server/utils/helper';
import { useCoursesByCreator } from '@/queries/use-courses';
import { CourseHeader } from '@/components/shared/course-header';
import { CoursePagination } from '@/components/shared/course-pagination';
import { Loader2 } from "lucide-react";
import { useEffect, useState } from 'react';

export default function StudentDetailsPage() {
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Query for courses
  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError
  } = useCoursesByCreator(
    user?.id || '',
    {
      page: currentPage,
      limit: 9,
      search: searchTerm, isLO: true
    },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    const getData = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    getData();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const courses = coursesData?.data || [];
  const pagination = coursesData?.pagination;

  return (
    <main className="px-2">
      <CourseHeader
        title="Courses"
        count={pagination?.total || 0}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Loading State */}
      {isCoursesLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading courses...</span>
        </div>
      )}

      {/* Error State */}
      {coursesError && (
        <div className="text-center py-8 text-red-500">
          Error loading courses. Please try again.
        </div>
      )}

      {/* Courses Grid */}
      {!isCoursesLoading && !coursesError && (
        <>
          <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2">
            {courses.map((course: any) => (
              <CourseCard
                key={course._id}
                href={`/dashboard/learning-outcomes/student-details/${course._id}`}
                template={course}
              />
            ))}
          </section>

          <CoursePagination
            total={pagination?.total || 0}
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            hasNext={pagination?.hasNext || false}
            hasPrev={pagination?.hasPrev || false}
            onPageChange={setCurrentPage}
          />

          {/* No Results */}
          {courses.length === 0 && !isCoursesLoading && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No courses found matching your search.' : 'No courses available.'}
            </div>
          )}
        </>
      )}
    </main>
  );
}
