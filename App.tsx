
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppConfig, HeatingVariable, LogEntry, HistoryData } from './types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from './constants';
import { apiService } from './services/apiService';
import Overview from './components/Overview';
import Settings from './components/Settings';
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
    return Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      temp: 50 + Math.random() * 20
    }));
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
  
  // BroadcastChannel: 100% Socket-frei, nutzt Browser-interne Kommunikation
  const syncChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      syncChannel.current = new BroadcastChannel('eta_data_sync');
      syncChannel.current.onmessage = (event) => {
        if (event.data.type === 'DATA_UPDATE') {
          setData(event.data.payload);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel nicht unterstützt, weiche auf Storage Events aus.");
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.DATA && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
          setLastUpdate(new Date().toLocaleTimeString());
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      syncChannel.current?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateData = useCallback(async (currentConfig: AppConfig) => {
    setIsUpdating(true);
    try {
      const vars = currentConfig.variables;
      const results: Record<string, HeatingVariable> = {};
      
      // Rein HTTP-basierte Abfragen
      await Promise.all(Object.entries(vars).map(async ([key, uri]) => {
        results[key] = await apiService.fetchVariable(currentConfig, uri);
      }));

      setData(results);
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(results));
      syncChannel.current?.postMessage({ type: 'DATA_UPDATE', payload: results });
      
      const updateTime = new Date().toLocaleTimeString();
      setLastUpdate(updateTime);
      
      const kesselTemp = parseFloat(results.kesselTemp?.strValue) || 0;
      setHistory(prev => {
        const newEntry = { time: updateTime.split(':').slice(0, 2).join(':'), temp: kesselTemp };
        const updated = [...prev.slice(-23), newEntry];
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
        return updated;
      });
      apiService.addLog("REST Update erfolgreich", 'success');
    } catch (err: any) {
      apiService.addLog(`Fehler: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    updateData(config);
    const interval = setInterval(() => updateData(config), config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config.refreshInterval, config.baseUrl, config.useMockData, updateData]);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    setView('overview');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-200">
            <FlameIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Heizungsmonitor</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">REST / HTTP Implementation</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8">
           <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Letzter Abruf</p>
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
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit mb-8">
          <button onClick={() => setView('overview')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'overview' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>Übersicht</button>
          <button onClick={() => setView('settings')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>System & Logs</button>
        </div>

        {view === 'overview' ? <Overview data={data} history={history} /> : <Settings config={config} onSave={handleSaveConfig} logs={logs} onClearLogs={() => setLogs([])} />}
      </main>
    </div>
  );
};

export default App;
