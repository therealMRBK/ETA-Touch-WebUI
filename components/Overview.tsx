
import React from 'react';
import { HeatingVariable } from '../types';
import DashboardCard from './DashboardCard';
// Fix: Added ThermometerIcon to the icons import
import { FlameIcon, BatteryIcon, DropletIcon, WindIcon, CheckCircleIcon, ThermometerIcon } from './Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  data: Record<string, HeatingVariable>;
  history: any[];
}

const Overview: React.FC<OverviewProps> = ({ data, history }) => {
  const getVal = (key: string) => data[key]?.strValue || '--';
  const getNum = (key: string) => parseFloat(data[key]?.strValue) || 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard 
          title="Kesseltemperatur" 
          value={getVal('kesselTemp').replace('°C', '')} 
          unit="°C" 
          icon={<FlameIcon className="text-orange-500" />} 
          colorClass="bg-orange-50/50"
        />
        <DashboardCard 
          title="Puffer oben" 
          value={getVal('pufferOben').replace('°C', '')} 
          unit="°C" 
          icon={<BatteryIcon className="text-yellow-600" />} 
          colorClass="bg-yellow-50/50"
        />
        <DashboardCard 
          title="Warmwasser" 
          value={getVal('warmwasser').replace('°C', '')} 
          unit="°C" 
          icon={<DropletIcon className="text-blue-500" />} 
          colorClass="bg-blue-50/50"
        />
        <DashboardCard 
          title="Außentemperatur" 
          value={getVal('aussenTemp').replace('°C', '')} 
          unit="°C" 
          icon={<WindIcon className="text-cyan-500" />} 
          colorClass="bg-cyan-50/50"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kessel Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex items-center space-x-2 self-start mb-4">
             <FlameIcon className="text-orange-500 w-5 h-5" />
             <h2 className="text-lg font-bold text-gray-800">Kessel</h2>
          </div>
          <div className="relative flex items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
              <circle 
                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={552.9} 
                strokeDashoffset={552.9 - (getNum('kesselTemp') / 100) * 552.9}
                className="text-orange-500" 
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-gray-800">{getNum('kesselTemp')}°C</span>
              <span className="text-xs text-gray-400 font-medium">Soll: {getVal('kesselSoll')}</span>
            </div>
          </div>
        </div>

        {/* Puffer Storage Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]">
           <div className="flex items-center space-x-2 mb-8">
             <BatteryIcon className="text-yellow-600 w-5 h-5" />
             <h2 className="text-lg font-bold text-gray-800">Pufferspeicher</h2>
          </div>
          <div className="flex justify-around items-end h-40 px-4">
             <div className="flex flex-col items-center">
               <span className="text-sm font-bold text-gray-700 mb-2">{getNum('pufferOben')}°C</span>
               <div className="w-12 bg-yellow-400 rounded-t-lg transition-all duration-500" style={{ height: `${getNum('pufferOben')}%` }}></div>
               <span className="text-[10px] text-gray-400 mt-2 uppercase">Oben</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-sm font-bold text-gray-700 mb-2">{getNum('pufferMitte')}°C</span>
               <div className="w-12 bg-yellow-300 rounded-t-lg transition-all duration-500" style={{ height: `${getNum('pufferMitte')}%` }}></div>
               <span className="text-[10px] text-gray-400 mt-2 uppercase">Mitte</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-sm font-bold text-gray-700 mb-2">{getNum('pufferUnten')}°C</span>
               <div className="w-12 bg-yellow-200 rounded-t-lg transition-all duration-500" style={{ height: `${getNum('pufferUnten')}%` }}></div>
               <span className="text-[10px] text-gray-400 mt-2 uppercase">Unten</span>
             </div>
          </div>
        </div>

        {/* Heizkreis 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]">
          <div className="flex items-center space-x-2 mb-6">
             <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
             </div>
             <h2 className="text-lg font-bold text-gray-800">Heizkreis 1</h2>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-xs text-gray-400 font-medium">Vorlauf</p>
                <p className="text-xl font-bold text-gray-800">{getVal('vorlaufTemp')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <DropletIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-xs text-gray-400 font-medium">Raum</p>
                <p className="text-xl font-bold text-gray-800">{getVal('raumTemp')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                 <ThermometerIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Temperaturverlauf (Letzte 24h)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <CheckCircleIcon className="text-green-500 w-8 h-8" />
        <div>
          <h3 className="text-gray-800 font-bold">Systemmeldungen</h3>
          <p className="text-gray-400 text-sm">Alle Systeme laufen normal. Keine aktiven Fehlermeldungen.</p>
        </div>
      </div>
    </div>
  );
};

export default Overview;
