
import { AppConfig, HeatingVariable, LogEntry } from '../types';
import { STORAGE_KEYS } from '../constants';

const parser = new DOMParser();

export const apiService = {
  async fetchVariable(config: AppConfig, uri: string): Promise<HeatingVariable> {
    if (config.useMockData) {
      return this.getMockVariable(uri);
    }

    const url = `${config.baseUrl}/user/var/${uri}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const xmlText = await response.text();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const valueEl = xmlDoc.getElementsByTagName('value')[0];

    if (!valueEl) throw new Error("Invalid XML response: Missing value tag");

    return {
      uri,
      name: valueEl.getAttribute('uri') || '',
      value: valueEl.textContent || '0',
      unit: valueEl.getAttribute('unit') || '',
      strValue: valueEl.getAttribute('strValue') || '',
      timestamp: Date.now()
    };
  },

  getMockVariable(uri: string): HeatingVariable {
    // Generate some stable-ish random data for the demo
    const baseValues: Record<string, number> = {
      '112/10021/0/0/12161': 65.4, // Kessel
      '112/10021/0/0/12001': 70.0, // Soll
      '112/10241/0/0/12197': 58.2, // Puffer Oben
      '112/10241/0/0/12198': 45.1, // Puffer Mitte
      '112/10241/0/0/12199': 32.8, // Puffer Unten
      '120/10221/0/0/12115': 52.0, // WW
      '120/10221/0/0/12101': 4.5,  // Aussen
      '120/10101/0/0/12241': 42.0, // Vorlauf
      '120/10101/0/0/12111': 21.5  // Raum
    };

    const baseVal = baseValues[uri] || 20;
    const variation = (Math.random() - 0.5) * 2;
    const finalVal = (baseVal + variation).toFixed(1);

    return {
      uri,
      name: "Mock Variable",
      value: (parseFloat(finalVal) * 10).toString(),
      unit: "°C",
      strValue: `${finalVal}°C`,
      timestamp: Date.now()
    };
  },

  addLog(message: string, level: LogEntry['level'] = 'info') {
    const logsStr = localStorage.getItem(STORAGE_KEYS.LOGS) || '[]';
    const logs: LogEntry[] = JSON.parse(logsStr);
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
    return updatedLogs;
  }
};
