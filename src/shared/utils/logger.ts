import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'success';

export type LogCategory =
  | 'CAD'
  | 'CAM'
  | 'GCODE'
  | 'PARSER'
  | 'PREVIEW'
  | 'MATERIAL'
  | 'UI'
  | 'WORKER'
  | 'PERF';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  correlationId?: string;
  sessionId?: string;
}

export type LogListener = (entry: LogEntry) => void;

class Logger {
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;
  private listeners: Set<LogListener> = new Set();
  private sessionId: string = uuidv4();

  constructor() {
    this.info('UI', 'Logger initialized', { sessionId: this.sessionId });
  }

  public subscribe(listener: LogListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(entry: LogEntry) {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
    this.listeners.forEach(l => l(entry));

    // Console output with colors
    const styles = {
      trace: 'color: #94a3b8',
      debug: 'color: #64748b',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444; font-weight: bold',
      success: 'color: #10b981',
    };

    const categoryStyle = 'font-weight: bold; padding: 2px 4px; border-radius: 2px; background: #334155; color: #f8fafc';

    console.log(
      `%c ${entry.category} %c %c${entry.level.toUpperCase()}%c ${entry.message}`,
      categoryStyle,
      '',
      styles[entry.level],
      '',
      entry.data ? entry.data : ''
    );
  }

  private createEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    correlationId?: string
  ): LogEntry {
    return {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data: this.sampleData(data),
      correlationId,
      sessionId: this.sessionId,
    };
  }

  private sampleData(data: any): any {
    if (!data) return data;
    if (Array.isArray(data) && data.length > 20) {
      return {
        sample: data.slice(0, 5),
        length: data.length,
        isSampled: true
      };
    }
    return data;
  }

  public trace(cat: LogCategory, msg: string, data?: any, corr?: string) { this.emit(this.createEntry('trace', cat, msg, data, corr)); }
  public debug(cat: LogCategory, msg: string, data?: any, corr?: string) { this.emit(this.createEntry('debug', cat, msg, data, corr)); }
  public info(cat: LogCategory, msg: string, data?: any, corr?: string) { this.emit(this.createEntry('info', cat, msg, data, corr)); }
  public warn(cat: LogCategory, msg: string, data?: any, corr?: string) { this.emit(this.createEntry('warn', cat, msg, data, corr)); }
  public error(cat: LogCategory, msg: string, data?: any, corr?: string) { this.emit(this.createEntry('error', cat, msg, data, corr)); }
  public success(cat: LogCategory, msg: string, data?: any, corr?: string) { this.emit(this.createEntry('success', cat, msg, data, corr)); }

  public getBuffer() { return [...this.buffer]; }
  public clear() { this.buffer = []; this.info('UI', 'Console cleared'); }
}

export const logger = new Logger();
