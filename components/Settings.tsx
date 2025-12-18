
import React, { useState } from 'react';
import { AppConfig, LogEntry } from '../types';
import { SettingsIcon, RefreshIcon } from './Icons';

interface SettingsProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
  logs: LogEntry[];
  onClearLogs: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave, logs, onClearLogs }) => {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="flex items-center space-x-2 mb-6">
          <SettingsIcon className="text-gray-400 w-6 h-6" />
          <h2 className="text-2xl font-bold text-gray-800">Konfiguration</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Basis API URL</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              value={localConfig.baseUrl}
              onChange={(e) => setLocalConfig({...localConfig, baseUrl: e.target.value})}
              placeholder="https://your-eta-ip:8080"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Abrufintervall (Sekunden)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                value={localConfig.refreshInterval}
                onChange={(e) => setLocalConfig({...localConfig, refreshInterval: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  checked={localConfig.useMockData}
                  onChange={(e) => setLocalConfig({...localConfig, useMockData: e.target.checked})}
                />
                <span className="text-sm font-bold text-gray-700">Mock-Modus (Demo)</span>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2"
            >
              <span>Einstellungen speichern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs View */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Service-Logs</h2>
          <button 
            onClick={onClearLogs}
            className="text-xs text-red-500 hover:text-red-600 font-bold uppercase tracking-wider"
          >
            Logs leeren
          </button>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-2">
          {logs.length === 0 ? (
            <p className="text-gray-400 italic">Keine Logs vorhanden.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex space-x-3 border-b border-gray-100 pb-1">
                <span className="text-gray-400 min-w-[70px]">{log.timestamp}</span>
                <span className={`uppercase font-bold min-w-[60px] ${
                  log.level === 'error' ? 'text-red-500' : 
                  log.level === 'success' ? 'text-green-500' : 'text-blue-500'
                }`}>
                  [{log.level}]
                </span>
                <span className="text-gray-700">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
