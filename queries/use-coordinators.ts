"use client";

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getUsersByRole, getUsersForManage } from '@/services/users.actions';

// Types
export type CoordinatorQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  collegeId?: string;
};

export type Coordinator = {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  collage?: {
    _id: string;
    english: string;
    logo: string;
    regional?: string;
    university?: string;
  } | null;
};

export type CoordinatorsResponse = {
  success: boolean;
  message: string;
  data: Coordinator[];
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
export const coordinatorKeys = {
  all: ['coordinators'] as const,
  byRole: (role: string) => [...coordinatorKeys.all, 'role', role] as const,
  byRoleWithParams: (role: string, params: CoordinatorQueryParams) =>
    [...coordinatorKeys.byRole(role), params] as const,
  forManage: (userId: string) => [...coordinatorKeys.all, 'manage', userId] as const,
  forManageWithParams: (userId: string, params: CoordinatorQueryParams) =>
    [...coordinatorKeys.forManage(userId), params] as const,
};

// Helper function to filter and paginate coordinators
const filterAndPaginateCoordinators = (
  coordinators: Coordinator[],
  params: CoordinatorQueryParams
): CoordinatorsResponse => {
  let filtered = [...coordinators];

  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (coordinator) =>
        coordinator.name.toLowerCase().includes(searchLower) ||
        coordinator.email.toLowerCase().includes(searchLower) ||
        coordinator.collage?.english.toLowerCase().includes(searchLower)
    );
  }

  // Apply college filter
  if (params.collegeId && params.collegeId !== 'all') {
    filtered = filtered.filter(
      (coordinator) => coordinator.collage?._id === params.collegeId
    );
  }

  // Calculate pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    success: true,
    message: 'Coordinators fetched successfully',
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Hook for coordinators by role
export function useCoordinatorsByRole(
  role: string,
  params: CoordinatorQueryParams = {},
  options?: Omit<UseQueryOptions<CoordinatorsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: coordinatorKeys.byRoleWithParams(role, params),
    queryFn: async () => {
      const coordinators = await getUsersByRole(role);
      return filterAndPaginateCoordinators(coordinators, params);
    },
    enabled: !!role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for coordinators for management (respects user permissions)
export function useCoordinatorsForManage(
  userId: string,
  params: CoordinatorQueryParams = {},
  options?: Omit<UseQueryOptions<CoordinatorsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: coordinatorKeys.forManageWithParams(userId, params),
    queryFn: async () => {
      const coordinators = await getUsersForManage(userId);
      return filterAndPaginateCoordinators(coordinators, params);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Generic hook that can be used for both
export function useCoordinators(
  userId: string,
  type: 'role' | 'manage' = 'manage',
  role?: string,
  params: CoordinatorQueryParams = {},
  options?: Omit<UseQueryOptions<CoordinatorsResponse>, 'queryKey' | 'queryFn'>
) {
  if (type === 'role' && role) {
    return useCoordinatorsByRole(role, params, options);
  }
  return useCoordinatorsForManage(userId, params, options);
}