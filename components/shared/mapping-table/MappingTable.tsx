'use client'
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Trash } from 'lucide-react'

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
  onUpdate?: (data: CLO[]) => void;
}

export default function MappingTable({ initialData, onUpdate }: MappingTableProps) {
  const [clos, setClos] = useState<CLO[]>(initialData);
  const [selectedCLOs, setSelectedCLOs] = useState<string[]>([]);

  const togglePLO = (cloIndex: number, type: 'k' | 's' | 'v', index: number) => {
    setClos(prev => {
      const newClos = structuredClone(prev);
      const key = `${type}${index + 1}`;
      const currentValue = Object.values(newClos[cloIndex].ploMapping[type][index])[0];
      newClos[cloIndex].ploMapping[type][index] = { [key]: !currentValue };
      onUpdate?.(newClos);
      return newClos;
    });
  };

  
  const updateCLODescription = (index: number, value: string) => {
    setClos(prev => {
      const newClos = [...prev];
      newClos[index].description = value;
      return newClos;
    });
  };

  const isPLOSelected = (clo: CLO, type: 'k' | 's' | 'v', index: number): boolean => {
    const plo = clo.ploMapping[type][index];
    return Object.values(plo)[0];
  };

  const toggleSelectAll = () => {
    if (selectedCLOs.length === clos.length) {
      setSelectedCLOs([]);
    } else {
      setSelectedCLOs(clos.map(clo => clo.id));
    }
  };

  const toggleSelectCLO = (id: string) => {
    setSelectedCLOs(prev => 
      prev.includes(id) 
        ? prev.filter(cloId => cloId !== id)
        : [...prev, id]
    );
  };

  const deleteSelectedCLOs = () => {
    setClos(prev => {
      const remaining = prev.filter(clo => !selectedCLOs.includes(clo.id));
      // If all CLOs are deleted, add one empty CLO
      if (remaining.length === 0) {
        return [{
          id: '1',
          description: 'CLO 1',
          ploMapping: {
            k: [{ k1: false }, { k2: false }, { k3: false }, { k4: false }],
            s: [{ s1: false }, { s2: false }, { s3: false }, { s4: false }],
            v: [{ v1: false }, { v2: false }, { v3: false }, { v4: false }]
          }
        }];
      }
      return remaining;
    });
    setSelectedCLOs([]);
  };
const default_rowSTyle = "p-0"
  

  return (
    <div className="p-4 relative">
      <h1 className="text-2xl font-bold mb-4">Assessment Plan</h1>
      
      {selectedCLOs.length > 0 && (
        <div className="mb-4 px-4 flex gap-4 absolute top-0 right-4 items-center justify-between bg-muted p-2 rounded-lg">
          <span className="text-sm">{selectedCLOs.length}  selected</span>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={deleteSelectedCLOs}
            className="flex items-center gap-2"
          >
            <Trash className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={3} className="border w-[50px]">
                <Checkbox 
                  checked={selectedCLOs.length === clos.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead rowSpan={3} className="border max-w-[10px]">S.No</TableHead>
              <TableHead rowSpan={3} className={`border px-3 py-0`}>CLOs</TableHead>
              <TableHead colSpan={12} className="text-center border">PLOs</TableHead>
            </TableRow>
            <TableRow>
              <TableHead colSpan={4} className="text-center border">Knowledge</TableHead>
              <TableHead colSpan={4} className="text-center border">Skills</TableHead>
              <TableHead colSpan={4} className="text-center border">Values</TableHead>
            </TableRow>
            <TableRow>
              {['k', 's', 'v'].map(type => (
                Array(4).fill(0).map((_, i) => (
                  <TableHead 
                    key={`${type}${i + 1}`} 
                    className="p-2 text-center border w-12 uppercase"
                  >
                    {type}{i + 1}
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
                    onCheckedChange={() => toggleSelectCLO(clo.id)}
                  />
                </TableCell>
                <TableCell className="border text-start max-w-[10px]">{rowIndex + 1}</TableCell>
                <TableCell className={`border min-w-[200px] ${default_rowSTyle}`}>
                  <Input
                    value={clo.description}
                    onChange={(e) => updateCLODescription(rowIndex, e.target.value)}
                    className="w-full bg-transparent border-none focus-visible:outline-none 
                    focus-visible:ring-0 
                    focus-visible:ring-offset-0 focus-visible:ring-offset-transparent focus-visible:ring-transparent focus-visible:outline-offset-transparent focus-visible:outline-offset-0"
                  />
                </TableCell>
                {['k', 's', 'v'].map(type => (
                  Array(4).fill(0).map((_, i) => (
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
        onClick={() => setClos(prev => [...prev, {
          id: (prev.length + 1).toString(),
          description: `CLO ${prev.length + 1}`,
          ploMapping: {
            k: [
              { k1: false },
              { k2: false },
              { k3: false },
              { k4: false }
            ],
            s: [
              { s1: false },
              { s2: false },
              { s3: false },
              { s4: false }
            ],
            v: [
              { v1: false },
              { v2: false },
              { v3: false },
              { v4: false }
            ]
          }
        }])}
        className="mt-4"
      >
        Add CLO
      </Button>
    </div>
  );
} 