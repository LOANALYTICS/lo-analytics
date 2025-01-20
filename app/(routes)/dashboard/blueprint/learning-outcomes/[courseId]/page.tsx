'use client'
import MappingTable, { CLO } from '@/components/shared/mapping-table/MappingTable'
import { useParams } from 'next/navigation';


export default function LeaningOutcomesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const defaultColumnCounts = {
    k: 4,
    s: 4,
    v: 4
  };

  const initialData: CLO[] = [{
    id: '1',
    description: 'CLO 1',
    ploMapping: {
      k: Array(defaultColumnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
      s: Array(defaultColumnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
      v: Array(defaultColumnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
    }
  }];

  const handleUpdate = (newData: CLO[]) => {
    console.log('Updated data:', newData);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Assessment Plan</h1>
      <MappingTable 
        initialData={initialData}
        defaultColumnCounts={defaultColumnCounts}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
