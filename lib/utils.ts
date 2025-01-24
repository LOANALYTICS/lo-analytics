import { CLO, PLOMapping } from "@/components/shared/mapping-table/MappingTable";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmptyPLOMapping(columnCounts: { k: number; s: number; v: number; }): PLOMapping {
  return {
    k: Array(columnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
    s: Array(columnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
    v: Array(columnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
  };
}

export function createEmptyCLO(clo: string, columnCounts: { k: number; s: number; v: number; }): CLO {
  return {
    clo,
    description: `CLO ${clo}`,
    ploMapping: createEmptyPLOMapping(columnCounts)
  };
}
