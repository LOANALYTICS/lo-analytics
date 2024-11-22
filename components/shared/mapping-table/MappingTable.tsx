 'use client'
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Plus, Trash, X } from 'lucide-react'

export type ColumnCounts = {
  k: number;
  s: number;
  v: number;
}

export type PLOItem = {
  [key: string]: boolean;
}

export type PLOMapping = {
  k: PLOItem[];
  s: PLOItem[];
  v: PLOItem[];
}

export type CLO = {
  id: string;
  description: string;
  ploMapping: PLOMapping;
}

interface MappingTableProps {
  initialData: CLO[];
  defaultColumnCounts: ColumnCounts;
  onUpdate: (data: CLO[]) => void;
}

export default function MappingTable({ initialData, defaultColumnCounts, onUpdate }: MappingTableProps) {
  const [clos, setClos] = useState<CLO[]>(initialData);
  const [selectedCLOs, setSelectedCLOs] = useState<string[]>([]);
  const [columnCounts, setColumnCounts] = useState<ColumnCounts>(defaultColumnCounts);

  const togglePLO = (cloIndex: number, type: 'k' | 's' | 'v', index: number) => {
    setClos(prev => {
      const newClos = structuredClone(prev);
      const key = `${type}${index + 1}`;
      const currentValue = Object.values(newClos[cloIndex].ploMapping[type][index])[0];
      newClos[cloIndex].ploMapping[type][index] = { [key]: !currentValue };
      onUpdate(newClos);
      return newClos;
    });
  };

  const updateCLODescription = (index: number, value: string) => {
    setClos(prev => {
      const newClos = [...prev];
      newClos[index].description = value;
      onUpdate(newClos);
      return newClos;
    });
  };

  const isPLOSelected = (clo: CLO, type: 'k' | 's' | 'v', index: number): boolean => {
    const plo = clo.ploMapping[type][index];
    return Object.values(plo)[0];
  };

  const addColumn = (type: 'k' | 's' | 'v') => {
    const newCount = columnCounts[type] + 1;
    setColumnCounts(prev => ({ ...prev, [type]: newCount }));
    
    setClos(prev => {
      const newClos = structuredClone(prev);
      newClos.forEach(clo => {
        clo.ploMapping[type].push({ [`${type}${newCount}`]: false });
      });
      onUpdate(newClos);
      return newClos;
    });
  };

  const removeColumn = (type: 'k' | 's' | 'v', index: number) => {
    if (columnCounts[type] <= 1) return;
    
    setColumnCounts(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    setClos(prev => {
      const newClos = structuredClone(prev);
      newClos.forEach(clo => {
        clo.ploMapping[type].splice(index, 1);
      });
      onUpdate(newClos);
      return newClos;
    });
  };

  return (
    <div className="p-4 relative w-full">
      <div className="border rounded-lg w-full overflow-auto max-w-[calc(100vw-2rem)]">
        <Table className="text-xs w-full">
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={3} className="border w-[50px]">
                <Checkbox 
                  checked={selectedCLOs.length === clos.length}
                  onCheckedChange={() => setSelectedCLOs(prev => 
                    prev.length === clos.length ? [] : clos.map(clo => clo.id)
                  )}
                />
              </TableHead>
              <TableHead rowSpan={3} className="border w-[50px]">S.No</TableHead>
              <TableHead rowSpan={3} className="border min-w-[200px]">CLOs</TableHead>
              <TableHead colSpan={columnCounts.k + columnCounts.s + columnCounts.v} className="text-center border">
                PLOs
              </TableHead>
            </TableRow>
            <TableRow>
              {['Knowledge', 'Skills', 'Values'].map((title, idx) => (
                <TableHead key={title} colSpan={columnCounts[['k', 's', 'v'][idx] as keyof ColumnCounts]} className="text-center border relative">
                  {title}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => addColumn(['k', 's', 'v'][idx] as 'k' | 's' | 'v')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {['k', 's', 'v'].map(type => (
                Array(columnCounts[type as keyof ColumnCounts]).fill(0).map((_, i) => (
                  <TableHead 
                    key={`${type}${i + 1}`} 
                    className="p-2 text-center border w-12 uppercase relative"
                  >
                    {type}{i + 1}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 hover:opacity-100"
                      onClick={() => removeColumn(type as 'k' | 's' | 'v', i)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </TableHead>
                ))
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clos.map((clo, rowIndex) => (
              <TableRow key={clo.id}>
                <TableCell className="border">
                  <Checkbox 
                    checked={selectedCLOs.includes(clo.id)}
                    onCheckedChange={() => setSelectedCLOs(prev => 
                      prev.includes(clo.id) ? prev.filter(id => id !== clo.id) : [...prev, clo.id]
                    )}
                  />
                </TableCell>
                <TableCell className="border text-center">{rowIndex + 1}</TableCell>
                <TableCell className="border p-0">
                  <Input
                    value={clo.description}
                    onChange={(e) => updateCLODescription(rowIndex, e.target.value)}
                    className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </TableCell>
                {['k', 's', 'v'].map(type => (
                  Array(columnCounts[type as keyof ColumnCounts]).fill(0).map((_, i) => (
                    <TableCell 
                      key={`${type}${i}`} 
                      className="p-2 text-center border cursor-pointer"
                      onClick={() => togglePLO(rowIndex, type as 'k' | 's' | 'v', i)}
                    >
                      <div 
                        className={cn(
                          "w-6 h-6 rounded-full mx-auto transition-colors duration-200",
                          isPLOSelected(clo, type as 'k' | 's' | 'v', i)
                            ? "bg-green-500" 
                            : "bg-gray-200"
                        )}
                      />
                    </TableCell>
                  ))
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        onClick={() => setClos(prev => {
          const newClo = {
            id: (prev.length + 1).toString(),
            description: `CLO ${prev.length + 1}`,
            ploMapping: {
              k: Array(columnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
              s: Array(columnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
              v: Array(columnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
            }
          };
          const newClos = [...prev, newClo];
          onUpdate(newClos);
          return newClos;
        })}
        className="mt-4"
      >
        Add CLO
      </Button>
    </div>
  );
}