'use client'
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Plus, Trash, X, ClipboardPaste } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

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
  clo: string;
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
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const togglePLO = (cloIndex: number, type: 'k' | 's' | 'v', index: number) => {
    setClos(prev => {
      const newClos = structuredClone(prev);
      const key = `${type}${index + 1}`;
      const currentValue = Object.values(newClos[cloIndex].ploMapping[type][index])[0];
      newClos[cloIndex].ploMapping[type][index] = { [key]: !currentValue };
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

  const addColumn = (type: 'k' | 's' | 'v') => {
    const newCount = columnCounts[type] + 1;
    setColumnCounts(prev => ({ ...prev, [type]: newCount }));

    setClos(prev => {
      const newClos = structuredClone(prev);
      newClos.forEach(clo => {
        clo.ploMapping[type].push({ [`${type}${newCount}`]: false });
      });
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
      return newClos;
    });
  };

  const handleBulkPaste = () => {
    // Split by newlines - each line from Excel is one CLO description
    const rows = bulkPasteText.split('\n').map(row => row.trim()).filter(row => row.length > 0);

    if (rows.length === 0) return;

    const newClos: CLO[] = rows.map((description, index) => ({
      clo: Date.now().toString() + index,
      description: description,
      ploMapping: {
        k: Array(columnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
        s: Array(columnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
        v: Array(columnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
      }
    }));

    setClos(prev => {
      const currentClos = prev.filter(clo => clo.description.trim() !== '');
      return [...currentClos, ...newClos];
    });

    setBulkPasteText('');
    setIsDialogOpen(false);
  };

  return (
    <div className="relative w-full pb-40">
      <div className="border-2 border-black rounded-lg w-full overflow-auto max-w-[calc(100vw-2rem)]">
        <Table className="text-xs w-full">
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={3} className="border border-black w-[50px]">
                <Checkbox
                  checked={clos.length > 0 && selectedCLOs.length === clos.length}
                  onCheckedChange={(checked) => {
                    setSelectedCLOs(checked ? clos.map(clo => clo.clo) : []);
                  }}
                />
              </TableHead>
              <TableHead rowSpan={3} className="border border-black w-[50px] font-bold text-black">S.No</TableHead>
              <TableHead rowSpan={3} className="border border-black min-w-[200px] font-bold text-black">Couse Learning Outcome (CLO) Description</TableHead>
              <TableHead colSpan={columnCounts.k + columnCounts.s + columnCounts.v} className="text-center border border-black font-bold text-black">
                PLOs
              </TableHead>
            </TableRow>
            <TableRow>
              {['Knowledge & Understanding', 'Skills', 'Values'].map((title, idx) => (
                <TableHead key={title} colSpan={columnCounts[['k', 's', 'v'][idx] as keyof ColumnCounts]} className="text-center border border-black relative group font-bold text-black">
                  {title}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute hidden group-hover:block right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
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
                    className="p-2 text-center border border-black w-12 uppercase relative font-bold text-black"
                  >
                    {type}{i + 1}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-px right-px h-4 w-4 p-0 opacity-0 hover:opacity-100"
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
              <TableRow key={clo.clo}>
                <TableCell className="border border-black">
                  <Checkbox
                    checked={selectedCLOs.includes(clo.clo)}
                    onCheckedChange={() => setSelectedCLOs(prev =>
                      prev.includes(clo.clo) ? prev.filter(id => id !== clo.clo) : [...prev, clo.clo]
                    )}
                  />
                </TableCell>
                <TableCell className="border text-center border-black">{rowIndex + 1}</TableCell>
                <TableCell className="border p-0 border-black">
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
                      className="p-2 text-center border border-black cursor-pointer"
                      onClick={() => togglePLO(rowIndex, type as 'k' | 's' | 'v', i)}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full mx-auto transition-colors duration-200",
                          isPLOSelected(clo, type as 'k' | 's' | 'v', i)
                            ? "bg-green-800"
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

      <div className="mt-4 flex gap-2">
        {selectedCLOs.length > 0 && (
          <Button
            type='button'
            variant="destructive"
            onClick={() => {
              setClos(prev => {
                const newClos = prev.filter(clo => !selectedCLOs.includes(clo.clo));

                if (newClos.length === 0) {
                  const newClo = {
                    clo: Date.now().toString(),
                    description: 'CLO 1',
                    ploMapping: {
                      k: Array(columnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
                      s: Array(columnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
                      v: Array(columnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
                    }
                  };
                  newClos.push(newClo);
                } else {
                  newClos.forEach((clo, index) => {
                    clo.description = clo.description.replace(/CLO \d+/, `CLO ${index + 1}`);
                  });
                }

                return newClos;
              });
              setSelectedCLOs([]);
            }}
            className="flex items-center gap-2"
          >
            <Trash className="h-4 w-4" />
            Delete Selected ({selectedCLOs.length})
          </Button>
        )}
        <Button
          type='button'
          onClick={() => setClos(prev => {
            const newClo = {
              clo: Date.now().toString(),
              description: `CLO ${prev.length + 1}`,
              ploMapping: {
                k: Array(columnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
                s: Array(columnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
                v: Array(columnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
              }
            };
            const newClos = [...prev, newClo];
            if (selectedCLOs.length === prev.length) {
              setSelectedCLOs([]);
            }
            return newClos;
          })}
        >
          Add CLO
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type='button' variant="outline" className="flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Bulk Paste CLOs
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Bulk Paste CLO Descriptions</DialogTitle>
              <DialogDescription>
                Paste CLO descriptions from Excel. Each row will create a new CLO entry. Multi-line descriptions are supported.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Paste CLO descriptions from Excel here..."
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                className="min-h-[200px]"
              />
              {bulkPasteText && (
                <p className="text-sm text-muted-foreground">
                  {bulkPasteText.split('\n').filter(row => row.trim()).length} CLO(s) will be created
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleBulkPaste}>
                Create CLOs
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="default"
          className="ml-auto"
          onClick={() => onUpdate(clos)}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}