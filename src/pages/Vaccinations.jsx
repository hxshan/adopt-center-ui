import React from 'react';
import { Syringe } from 'lucide-react';
import { ComingSoon } from '../components/ui/ComingSoon';

const Vaccinations = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vaccinations</h1>
                <p className="text-slate-500 mt-1">Track vaccination schedules and medical records.</p>
            </div>
            <ComingSoon
                title="Vaccination Tracking"
                icon={Syringe}
                description="Vaccination tracking and scheduling is coming soon. You'll be able to log, track, and manage vaccine records for all your pets in one place."
            />
        </div>
    );
};

export default Vaccinations;
