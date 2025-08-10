"use client";

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getCoursesByCreator, getCoursesByUserRoleForItems } from '@/services/courses.action';

// Types
export type CourseQueryParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export type Course = {
    _id: string;
    course_name: string;
    semister: number;
    department: string;
    university_name?: string;
    course_code: string;
    credit_hours: string;
    level: number;
    examType: string;
    question_ref?: string;
    academic_year: string;
    section: string;
    collage?: {
        _id: string;
        english: string;
        logo: string;
    } | null;
    coordinator: Array<{
        _id: string;
        name: string;
    }>;
    createdBy?: string;
    students: any[];
    krValues: string | boolean | null;
};

export type CoursesResponse = {
    success: boolean;
    message: string;
    data: Course[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};

// Query Keys
export const courseKeys = {
    all: ['courses'] as const,
    byCreator: (userId: string) => [...courseKeys.all, 'creator', userId] as const,
    byCreatorWithParams: (userId: string, params: CourseQueryParams) =>
        [...courseKeys.byCreator(userId), params] as const,
    byUserRole: (userId: string) => [...courseKeys.all, 'userRole', userId] as const,
    byUserRoleWithParams: (userId: string, params: CourseQueryParams) =>
        [...courseKeys.byUserRole(userId), params] as const,
};

// Hook for courses by creator
export function useCoursesByCreator(
    userId: string,
    params: CourseQueryParams = {},
    options?: Omit<UseQueryOptions<CoursesResponse>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: courseKeys.byCreatorWithParams(userId, params),
        queryFn: () => getCoursesByCreator(userId, params),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
}

// Hook for courses by user role (for items)
export function useCoursesByUserRole(
    userId: string,
    params: CourseQueryParams = {},
    options?: Omit<UseQueryOptions<CoursesResponse>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: courseKeys.byUserRoleWithParams(userId, params),
        queryFn: () => getCoursesByUserRoleForItems(userId, params),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
}

// Generic hook that can be used for both
export function useCourses(
    userId: string,
    type: 'creator' | 'userRole' = 'userRole',
    params: CourseQueryParams = {},
    options?: Omit<UseQueryOptions<CoursesResponse>, 'queryKey' | 'queryFn'>
) {
    if (type === 'creator') {
        return useCoursesByCreator(userId, params, options);
    }
    return useCoursesByUserRole(userId, params, options);
}