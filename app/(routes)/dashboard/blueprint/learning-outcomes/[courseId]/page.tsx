'use client'
import MappingTable, { CLO } from '@/components/shared/mapping-table/MappingTable'
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCLOData, updateCLOData } from '@/services/blueprint/learning-outcome.action';
import { toast } from 'sonner';

export default function LeaningOutcomesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [cloData, setCloData] = useState<CLO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultColumnCounts = {
    k: 4,
    s: 4,
    v: 4
  };

  const getInitialData = (): CLO[] => [{
    clo: '1',
    description: 'CLO 1',
    ploMapping: {
      k: Array(defaultColumnCounts.k).fill(0).map((_, i) => ({ [`k${i + 1}`]: false })),
      s: Array(defaultColumnCounts.s).fill(0).map((_, i) => ({ [`s${i + 1}`]: false })),
      v: Array(defaultColumnCounts.v).fill(0).map((_, i) => ({ [`v${i + 1}`]: false }))
    }
  }];

  useEffect(() => {
    const fetchCLOData = async () => {
      try {
        const data = await getCLOData(courseId);
        setCloData(data || getInitialData());
      } catch (error) {
        toast.error('Failed to fetch CLO data');
        setCloData(getInitialData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchCLOData();
  }, [courseId]);

  const handleUpdate = async (newData: CLO[]) => {
    try {
      const result = await updateCLOData(courseId, newData);
      if (result.success) {
        toast.success('CLO data updated successfully');
        setCloData(newData);
      } else {
        toast.error('Failed to update CLO data');
      }
    } catch (error) {
      toast.error('Failed to update CLO data');
      console.error('Error updating CLO data:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Assessment Plan</h1>
      <MappingTable 
        initialData={cloData}
        defaultColumnCounts={defaultColumnCounts}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
