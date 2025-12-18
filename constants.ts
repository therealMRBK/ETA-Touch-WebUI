
import { AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  baseUrl: 'https://pellets.bravokilo.cloud',
  refreshInterval: 60,
  useMockData: true, // Default to true for demo if API is unreachable
  variables: {
    kesselTemp: '112/10021/0/0/12161',
    kesselSoll: '112/10021/0/0/12001',
    pufferOben: '112/10241/0/0/12197',
    pufferMitte: '112/10241/0/0/12198',
    pufferUnten: '112/10241/0/0/12199',
    warmwasser: '120/10221/0/0/12115',
    aussenTemp: '120/10221/0/0/12101',
    vorlaufTemp: '120/10101/0/0/12241',
    raumTemp: '120/10101/0/0/12111',
  }
};

export const STORAGE_KEYS = {
  CONFIG: 'eta_monitor_config',
  DATA: 'eta_monitor_latest_data',
  LOGS: 'eta_monitor_logs',
  HISTORY: 'eta_monitor_history'
};
