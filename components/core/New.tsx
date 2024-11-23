'use client'

import { migrateKrValuesField } from '@/services/courses.action';
import { useTransition } from 'react';

export default function MigrateButton() {
    const [isPending, startTransition] = useTransition();

    return (
        <button 
            onClick={() => startTransition(async () => {
                const result = await migrateKrValuesField();
                if (result.success) {
                    alert('Migration completed successfully!');
                } else {
                    alert('Migration failed: ' + result.error);
                }
            })}
            disabled={isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
            {isPending ? 'Migrating KR Values...' : 'Migrate KR Values'}
        </button>
    );
} 