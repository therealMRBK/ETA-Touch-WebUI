
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Settings, LayoutDashboard, History, Activity, Flame, Droplets, Thermometer, 
  Wind, ChevronRight, AlertCircle, CheckCircle2, RefreshCcw, Database
} from 'lucide-react';

// --- TYPES ---
interface HeatingData {
  kesselTemp: number;
  kesselSoll: number;
  pufferOben: number;
  pufferMitte: number;
  pufferUnten: number;
  warmwasser: number;
  aussenTemp: number;
  vorlaufTemp: number;
  timestamp: string;
}

interface LogEntry {
  id: string;
  time: string;
  msg: string;
  type: 'info' | 'success' | 'error';
}

// --- BACKGROUND SERVICE (DER "DIENST") ---
class BackgroundService {
  private static STORAGE_KEY = 'eta_local_db';
  private static LOG_KEY = 'eta_logs';
  private static CONFIG_KEY = 'eta_config';

  static getConfig() {
    const saved = localStorage.getItem(this.CONFIG_KEY);
    return saved ? JSON.parse(saved) : {
      baseUrl: 'https://pc.bravokilo.cloud',
      interval: 60,
      mockMode: true
    };
  }

  static setConfig(config: any) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  static addLog(msg: string, type: LogEntry['type'] = 'info') {
    const logs = JSON.parse(localStorage.getItem(this.LOG_KEY) || '[]');
    const entry = { id: Date.now().toString(), time: new Date().toLocaleTimeString(), msg, type };
    localStorage.setItem(this.LOG_KEY, JSON.stringify([entry, ...logs].slice(0, 50)));
    window.dispatchEvent(new Event('storage')); // Trigger UI Update
  }

  static async fetchData() {
    const config = this.getConfig();
    this.addLog(`Starte Daten-Abruf von ${config.baseUrl}...`, 'info');

    try {
      let data: HeatingData;
      
      if (config.mockMode) {
        // Simulation der API-Antwort
        data = {
          kesselTemp: 60 + Math.random() * 10,
          kesselSoll: 70,
          pufferOben: 55 + Math.random() * 5,
          pufferMitte: 45 + Math.random() * 5,
          pufferUnten: 35 + Math.random() * 5,
          warmwasser: 52,
          aussenTemp: 4.5 + Math.random() * 2,
          vorlaufTemp: 42,
          timestamp: new Date().toISOString()
        };
      } else {
        // Echtes Fetching (Wird serverseitig empfohlen, hier im Browser implementiert)
        // Hinweis: Browser-seitig könnte CORS ein Problem sein, wenn die API keine Header sendet.
        const response = await fetch(`${config.baseUrl}/user/menu`); 
        if (!response.ok) throw new Error("API nicht erreichbar");
        const xml = await response.text();
        // Hier würde das XML-Parsing für die spezifischen ETA-URIs erfolgen
        data = { kesselTemp: 65, kesselSoll: 70, pufferOben: 60, pufferMitte: 50, pufferUnten: 40, warmwasser: 55, aussenTemp: 5, vorlaufTemp: 45, timestamp: new Date().toISOString() };
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      // Historie pflegen
      const history = JSON.parse(localStorage.getItem('eta_history') || '[]');
      const historyEntry = { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), temp: data.kesselTemp };
      localStorage.setItem('eta_history', JSON.stringify([...history.slice(-23), historyEntry]));

      this.addLog("Daten erfolgreich in lokalen Speicher geschrieben.", 'success');
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      this.addLog(`Fehler beim Daten-Abruf: ${err.message}`, 'error');
    }
  }
}

// --- COMPONENTS ---

const Card = ({ title, value, unit, icon: Icon, color }: any) => (
  <div className="glass p-5 rounded-3xl transition-all hover:shadow-xl hover:translate-y-[-2px]">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-2xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span>
    </div>
    <div className="flex flex-col">
      <span className="text-gray-500 text-sm font-medium">{title}</span>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-black text-gray-800">{value}</span>
        <span className="text-sm font-bold text-gray-400">{unit}</span>
      </div>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<HeatingData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState(BackgroundService.getConfig());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLocalData = () => {
    const local = localStorage.getItem('eta_local_db');
    const hist = localStorage.getItem('eta_history');
    const lgs = localStorage.getItem('eta_logs');
    if (local) setData(JSON.parse(local));
    if (hist) setHistory(JSON.parse(hist));
    if (lgs) setLogs(JSON.parse(lgs));
  };

  useEffect(() => {
    loadLocalData();
    window.addEventListener('storage', loadLocalData);
    
    // Simulierter Hintergrund-Dienst
    const interval = setInterval(() => {
      BackgroundService.fetchData();
    }, config.interval * 1000);

    return () => {
      window.removeEventListener('storage', loadLocalData);
      clearInterval(interval);
    };
  }, [config.interval]);

  const manualRefresh = async () => {
    setIsRefreshing(true);
    await BackgroundService.fetchData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSaveConfig = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newConfig = {
      baseUrl: formData.get('baseUrl'),
      interval: Number(formData.get('interval')),
      mockMode: formData.get('mockMode') === 'on'
    };
    BackgroundService.setConfig(newConfig);
    setConfig(newConfig);
    BackgroundService.addLog("Konfiguration gespeichert", 'info');
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white border-r border-gray-100 p-6 flex flex-col space-y-8">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Flame className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 leading-tight">ETA Core</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Service Node v2.0</p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'settings', icon: Settings, label: 'Konfiguration' },
            { id: 'logs', icon: Activity, label: 'Dienst-Logs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${
                activeTab === tab.id 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 translate-x-1' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto p-4 bg-orange-50 rounded-3xl border border-orange-100">
          <p className="text-[10px] font-black text-orange-800 uppercase mb-2">System Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-orange-900">Daten-Dienst aktiv</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {activeTab === 'overview' ? 'Heizungs-Monitor' : activeTab === 'settings' ? 'System-Setup' : 'Aktivitäts-Log'}
            </h2>
            <p className="text-gray-400 font-medium italic">
              {data ? `Letzter Sync: ${new Date(data.timestamp).toLocaleTimeString()}` : 'Warte auf Daten...'}
            </p>
          </div>
          <button 
            onClick={manualRefresh}
            className={`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-6 h-6 text-orange-600" />
          </button>
        </header>

        {activeTab === 'overview' && data && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card title="Kessel Ist" value={data.kesselTemp.toFixed(1)} unit="°C" icon={Flame} color="bg-orange-500" />
              <Card title="Puffer Oben" value={data.pufferOben.toFixed(1)} unit="°C" icon={Database} color="bg-blue-600" />
              <Card title="Warmwasser" value={data.warmwasser.toFixed(1)} unit="°C" icon={Droplets} color="bg-cyan-500" />
              <Card title="Außen" value={data.aussenTemp.toFixed(1)} unit="°C" icon={Wind} color="bg-emerald-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Boiler Gauge */}
              <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center">
                <h3 className="text-gray-800 font-bold mb-8 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-orange-500" /> Kessel-Status
                </h3>
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                    <circle 
                      cx="96" cy="96" r="80" stroke="#f97316" strokeWidth="12" fill="none"
                      strokeDasharray="502.6"
                      strokeDashoffset={502.6 - (data.kesselTemp / 100) * 502.6}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-800">{data.kesselTemp.toFixed(0)}°</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Soll: {data.kesselSoll}°</span>
                  </div>
                </div>
              </div>

              {/* Buffer Storage */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm">
                <h3 className="text-gray-800 font-bold mb-8 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" /> Pufferspeicher Schichtung
                </h3>
                <div className="flex justify-between items-end h-48 px-4 border-b border-gray-50 pb-2">
                  {[
                    { val: data.pufferOben, label: 'Oben', col: 'bg-blue-600' },
                    { val: data.pufferMitte, label: 'Mitte', col: 'bg-blue-400' },
                    { val: data.pufferUnten, label: 'Unten', col: 'bg-blue-200' }
                  ].map((p, i) => (
                    <div key={i} className="flex flex-col items-center w-full max-w-[80px]">
                      <span className="text-xs font-black text-gray-700 mb-2">{p.val.toFixed(1)}°</span>
                      <div 
                        className={`w-full rounded-t-2xl transition-all duration-1000 ${p.col}`} 
                        style={{ height: `${(p.val / 80) * 100}%` }}
                      ></div>
                      <span className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Graph */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
              <h3 className="text-gray-800 font-bold mb-8">Kesseltemperatur Verlauf</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis domain={[20, 90]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={4} fill="url(#colorTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl animate-fadeIn">
            <form onSubmit={handleSaveConfig} className="bg-white p-10 rounded-[2.5rem] shadow-sm space-y-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Basis API URL</label>
                <input 
                  name="baseUrl" 
                  defaultValue={config.baseUrl} 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Intervall (s)</label>
                  <input 
                    name="interval" 
                    defaultValue={config.interval} 
                    type="number" 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">
                    <input name="mockMode" defaultChecked={config.mockMode} type="checkbox" className="w-5 h-5 text-orange-600 rounded-lg focus:ring-orange-500" />
                    <span className="text-sm font-bold text-gray-700">Demo-Modus</span>
                  </label>
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all uppercase tracking-widest text-sm"
              >
                Konfiguration anwenden
              </button>
            </form>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Dienst-Protokoll</span>
              <button onClick={() => { localStorage.setItem('eta_logs', '[]'); loadLocalData(); }} className="text-[10px] font-bold text-red-500 uppercase">Leeren</button>
            </div>
            <div className="h-[500px] overflow-y-auto p-4 space-y-2 font-mono text-[11px] no-scrollbar">
              {logs.map(log => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border-l-4 transition-all" style={{ borderLeftColor: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : '#3b82f6' }}>
                  <span className="text-gray-400 font-bold">{log.time}</span>
                  <span className="flex-1 text-gray-700">{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest">Keine Ereignisse</p>}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
