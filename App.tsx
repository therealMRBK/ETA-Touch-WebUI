
import React, { useState, useEffect, useCallback } from 'react';
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
    return [];
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(() => {
    const latestData = localStorage.getItem(STORAGE_KEYS.DATA);
    if (latestData) {
      const parsed = JSON.parse(latestData);
      const firstKey = Object.keys(parsed)[0];
      if (firstKey && parsed[firstKey].timestamp) {
        return new Date(parsed[firstKey].timestamp).toLocaleTimeString();
      }
    }
    return '--:--:--';
  });

  // Dienst-Simulation: Holt Daten via HTTP und speichert sie "dumm" im LocalStorage
  const runDataService = useCallback(async () => {
    setIsUpdating(true);
    const newLogs = apiService.addLog("Hintergrund-Dienst: Starte REST-Abruf...", 'info');
    setLogs(newLogs);

    try {
      const results: Record<string, HeatingVariable> = {};
      const vars = config.variables;
      
      // Serieller oder paralleler HTTP GET Abruf (KEIN WebSocket)
      // Fix: Cast Object.entries to [string, string][] to avoid 'unknown' type inference for uri
      await Promise.all((Object.entries(vars) as [string, string][]).map(async ([key, uri]) => {
        results[key] = await apiService.fetchVariable(config, uri);
      }));

      // Cache in "Datenbank" (LocalStorage) schreiben
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(results));
      setData(results);
      
      const now = new Date();
      const updateTime = now.toLocaleTimeString();
      setLastUpdate(updateTime);

      // Verlauf aktualisieren
      const kesselTemp = parseFloat(results.kesselTemp?.strValue) || 0;
      setHistory(prev => {
        const newEntry = { time: updateTime.split(':').slice(0, 2).join(':'), temp: kesselTemp };
        const updated = [...prev.slice(-23), newEntry];
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
        return updated;
      });

      setLogs(apiService.addLog("Hintergrund-Dienst: Daten erfolgreich zwischengespeichert.", 'success'));
    } catch (err: any) {
      setLogs(apiService.addLog(`Dienst-Fehler: ${err.message}`, 'error'));
    } finally {
      setIsUpdating(false);
    }
  }, [config]);

  // Einmaliger Abruf beim Mounten (Initiale "Dumm"-Anzeige)
  useEffect(() => {
    // Falls noch nie Daten da waren, einmalig laden
    if (Object.keys(data).length === 0) {
      runDataService();
    }
  }, []);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    setLogs(apiService.addLog("System-Konfiguration aktualisiert.", 'info'));
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
            <h1 className="text-xl font-black text-gray-800 tracking-tight">ETA Heizung</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Storage-Based Dashboard (No Sockets)</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Stand Zwischenspeicher</p>
              <p className="text-sm font-bold text-gray-700">{lastUpdate}</p>
           </div>
           <button 
            onClick={runDataService}
            disabled={isUpdating}
            className={`p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors ${isUpdating ? 'animate-spin opacity-50' : ''}`}
            title="Dienst manuell starten"
           >
             <RefreshIcon className="text-orange-500 w-5 h-5" />
           </button>
           <button 
            onClick={() => setView(view === 'overview' ? 'settings' : 'overview')}
            className={`p-2 rounded-xl transition-colors ${view === 'settings' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
           >
             <SettingsIcon className="w-5 h-5" />
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-2xl w-fit mb-8">
          <button 
            onClick={() => setView('overview')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'overview' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Monitor
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'settings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Service & Config
          </button>
        </div>

        {view === 'overview' ? (
          <Overview data={data} history={history} />
        ) : (
          <Settings 
            config={config} 
            onSave={handleSaveConfig} 
            logs={logs} 
            onClearLogs={() => {
              localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
              setLogs([]);
            }} 
          />
        )}
      </main>

      <footer className="mt-20 text-center text-gray-300 text-[10px] uppercase font-bold tracking-[0.2em]">
        Server Port: 8080 &bull; Base-URL: {config.baseUrl} &bull; WebSockets: Disabled
      </footer>
    </div>
  );
};

export default App;
