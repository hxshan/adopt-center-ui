import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import { Button } from './button';

export function ComingSoon({ title, description, icon: Icon = Wrench }) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center max-w-md gap-4">
                <div className="p-5 bg-pink-50 rounded-full">
                    <Icon className="w-12 h-12 text-pink-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-pink-500">Coming Soon</p>
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                </div>
                {description && (
                    <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                )}
                <p className="text-xs text-slate-400">We're working hard to bring this feature to you.</p>
                <Button
                    variant="ghost"
                    className="mt-2 text-slate-600 hover:text-slate-900"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
}
