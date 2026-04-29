import { Plus, Users, BookOpen } from 'lucide-react';

export function ClassesPage() {
    const classes = [
        { id: 1, label: '2024-CSE-A', batch: '2024-2028', branch: 'CSE', students: 58, subjects: 6, incharge: 'Dr. Rajesh Kumar' },
        { id: 2, label: '2024-CSE-B', batch: '2024-2028', branch: 'CSE', students: 56, subjects: 6, incharge: 'Dr. Priya Sharma' },
        { id: 3, label: '2024-ECE-A', batch: '2024-2028', branch: 'ECE', students: 52, subjects: 5, incharge: 'Dr. Amit Patel' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Classes</h1>
                    <p className="text-text-secondary mt-1">Manage class structure</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Class
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                    <div key={cls.id} className="glass-card p-5 cursor-pointer">
                        <h3 className="font-semibold text-lg text-text-primary">{cls.label}</h3>
                        <p className="text-text-secondary text-sm">{cls.batch}</p>
                        <div className="mt-4 flex gap-4 text-sm text-text-secondary">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{cls.students}</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{cls.subjects}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
