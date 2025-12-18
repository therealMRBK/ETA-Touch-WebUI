
export interface HeatingVariable {
  uri: string;
  name: string;
  value: string;
  unit: string;
  strValue: string;
  timestamp: number;
}

export interface AppConfig {
  baseUrl: string;
  refreshInterval: number; // in seconds
  useMockData: boolean;
  variables: {
    kesselTemp: string;
    kesselSoll: string;
    pufferOben: string;
    pufferMitte: string;
    pufferUnten: string;
    warmwasser: string;
    aussenTemp: string;
    vorlaufTemp: string;
    raumTemp: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'success';
  message: string;
}

export interface HistoryData {
  time: string;
  temp: number;
}
