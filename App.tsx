
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppConfig, HeatingVariable, LogEntry, HistoryData } from './types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from './constants';
import { apiService } from './services/apiService';
import Overview from './components/Overview';
import Settings from './components/Settings';
// Fix: Added FlameIcon to the icons import
import { SettingsIcon, RefreshIcon, FlameIcon } from './components/Icons';

const App: React.FC = () => {
  const [view, setView] = useState<'overview' | 'settings'>('overview');
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  const [data, setData] = useState<Record<string, HeatingVariable>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DATA);
    return saved ? JSON.parse(saved) : {};
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<HistoryData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) return JSON.parse(saved);
    // Initial dummy history
    return Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      temp: 50 + Math.random() * 20
    }));
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');

  const updateData = useCallback(async (currentConfig: AppConfig) => {
    setIsUpdating(true);
    const newLogs = apiService.addLog("Starte Datenabruf...", 'info');
    setLogs(newLogs);

    try {
      const vars = currentConfig.variables;
      const results: Record<string, HeatingVariable> = {};
      
      // Fetch all variables sequentially or in parallel
      const fetchPromises = Object.entries(vars).map(async ([key, uri]) => {
        const val = await apiService.fetchVariable(currentConfig, uri);
        results[key] = val;
      });

      await Promise.all(fetchPromises);
      
      setData(results);
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(results));
      
      const updateTime = new Date().toLocaleTimeString();
      setLastUpdate(updateTime);
      
      // Update History with KesselTemp
      const kesselTemp = parseFloat(results.kesselTemp?.strValue) || 0;
      setHistory(prev => {
        const newEntry = { time: updateTime.split(':').slice(0, 2).join(':'), temp: kesselTemp };
        const updated = [...prev.slice(-23), newEntry];
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
        return updated;
      });

      setLogs(apiService.addLog("Daten erfolgreich aktualisiert", 'success'));
    } catch (err: any) {
      setLogs(apiService.addLog(`Fehler beim Abruf: ${err.message}`, 'error'));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Polling logic
  useEffect(() => {
    updateData(config);
    const interval = setInterval(() => {
      updateData(config);
    }, config.refreshInterval * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.refreshInterval, config.baseUrl, config.useMockData]);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    setLogs(apiService.addLog("Konfiguration gespeichert", 'info'));
    setView('overview');
  };

  const handleClearLogs = () => {
    localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-200">
            <FlameIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Heizungsmonitor</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ETA Heizungssteuerung</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8">
           <div className="flex items-center space-x-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-bold text-gray-500 uppercase">Online</span>
           </div>
           <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Zuletzt aktualisiert</p>
              <p className="text-sm font-bold text-gray-700">{lastUpdate}</p>
           </div>
           <button 
            onClick={() => updateData(config)}
            disabled={isUpdating}
            className={`p-2 rounded-xl hover:bg-gray-50 transition-colors ${isUpdating ? 'animate-spin' : ''}`}
           >
             <RefreshIcon className="text-gray-400 w-5 h-5" />
           </button>
           <button 
            onClick={() => setView(view === 'overview' ? 'settings' : 'overview')}
            className={`p-2 rounded-xl hover:bg-gray-50 transition-colors ${view === 'settings' ? 'bg-orange-50 text-orange-500' : 'text-gray-400'}`}
           >
             <SettingsIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Mobile menu button could go here */}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit mb-8">
          <button 
            onClick={() => setView('overview')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'overview' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Übersicht
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Konfiguration
          </button>
        </div>

        {view === 'overview' ? (
          <Overview data={data} history={history} />
        ) : (
          <Settings 
            config={config} 
            onSave={handleSaveConfig} 
            logs={logs} 
            onClearLogs={handleClearLogs} 
          />
        )}
      </main>

      {/* Footer / Credits */}
      <footer className="mt-20 text-center text-gray-300 text-[10px] uppercase font-bold tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Heizungsmonitor v1.2 &bull; ETA Touch Webservices
      </footer>
      
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;
