'use client'
import MappingTable, { CLO, PLOMapping } from '@/components/shared/mapping-table/MappingTable'

export default function AssessmentPlanPage() {
  const initialData: CLO[] = [
    {
      id: '1',
      description: 'CLO 1',
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
    }
  ];

  const handleUpdate = (newData: CLO[]) => {
    // Handle updates if needed
    console.log('Updated data:', newData);
  };

  return (
    <div className="">
      <MappingTable 
        initialData={initialData} 
        onUpdate={handleUpdate}
      />
    </div>
  );
}
