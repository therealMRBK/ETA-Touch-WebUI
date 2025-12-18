
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  colorClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, unit, icon, colorClass }) => {
  return (
    <div className={`p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <h3 className="text-gray-600 font-medium text-sm">{title}</h3>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
};

export default DashboardCard;
