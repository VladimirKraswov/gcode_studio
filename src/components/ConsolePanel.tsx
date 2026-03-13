import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logger, type LogEntry, type LogLevel, type LogCategory } from '@/shared/utils/logger';
import { FiTrash2, FiDownload, FiSearch, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Badge } from '@/shared/components/ui/Badge';

export function ConsolePanel() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<LogCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    setLogs(logger.getBuffer());
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [...prev.slice(-999), entry]);
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const levelMatch = filterLevel === 'all' || log.level === filterLevel;
      const categoryMatch = filterCategory === 'all' || log.category === filterCategory;
      const searchMatch = !search ||
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(search.toLowerCase()));
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [logs, filterLevel, filterCategory, search]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcode-studio-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full bg-panel-solid text-[13px] font-mono">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-panel-muted shrink-0">
        <div className="relative flex-1">
          <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={t("console.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1 bg-bg border border-border rounded-md outline-none focus:border-primary"
          />
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as any)}
          className="bg-bg border border-border rounded-md px-2 py-1 outline-none"
        >
          <option value="all">{t("console.all_levels")}</option>
          <option value="trace">{t("console.level_trace")}</option>
          <option value="debug">{t("console.level_debug")}</option>
          <option value="info">{t("console.level_info")}</option>
          <option value="warn">{t("console.level_warn")}</option>
          <option value="error">{t("console.level_error")}</option>
          <option value="success">{t("console.level_success")}</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as any)}
          className="bg-bg border border-border rounded-md px-2 py-1 outline-none"
        >
          <option value="all">{t("console.all_categories")}</option>
          <option value="CAD">{t("console.cat_cad")}</option>
          <option value="CAM">{t("console.cat_cam")}</option>
          <option value="GCODE">{t("console.cat_gcode")}</option>
          <option value="PARSER">{t("console.cat_parser")}</option>
          <option value="PREVIEW">{t("console.cat_preview")}</option>
          <option value="MATERIAL">{t("console.cat_material")}</option>
          <option value="UI">{t("console.cat_ui")}</option>
          <option value="WORKER">{t("console.cat_worker")}</option>
          <option value="PERF">{t("console.cat_perf")}</option>
        </select>

        <button
          onClick={() => logger.clear()}
          title={t("common.clear")}
          className="p-1.5 hover:bg-bg-soft rounded-md text-text-muted hover:text-danger transition-colors"
        >
          <FiTrash2 size={16} />
        </button>

        <button
          onClick={handleExport}
          title={t("console.export_json")}
          className="p-1.5 hover:bg-bg-soft rounded-md text-text-muted hover:text-primary transition-colors"
        >
          <FiDownload size={16} />
        </button>

        <div className="flex items-center gap-2 ml-2 border-l border-border pl-2">
          <input
            type="checkbox"
            id="autoscroll"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          <label htmlFor="autoscroll" className="text-text-muted whitespace-nowrap">{t("console.auto_scroll")}</label>
        </div>
      </div>

      {/* Log List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-1 space-y-px"
      >
        {filteredLogs.map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
        {filteredLogs.length === 0 && (
          <div className="h-full flex items-center justify-center text-text-muted italic">
            {t("console.no_logs")}
          </div>
        )}
      </div>
    </div>
  );
}

function LogItem({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  const levelColors = {
    trace: 'text-slate-400',
    debug: 'text-slate-500',
    info: 'text-blue-500',
    warn: 'text-amber-500',
    error: 'text-red-500 font-bold',
    success: 'text-emerald-500',
  };

  const time = new Date(log.timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });

  return (
    <div className="group hover:bg-bg-soft rounded px-1 py-0.5 border-l-2 border-transparent hover:border-border transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-text-muted shrink-0 w-24">[{time}]</span>
        <div className="w-16 shrink-0">
           <Badge variant="ghost" className="text-[9px] px-1 py-0 h-4 border-border text-text-muted">
             {log.category}
           </Badge>
        </div>
        <span className={`shrink-0 w-16 ${levelColors[log.level]}`}>
          {log.level.toUpperCase()}
        </span>
        <span className="flex-1 break-all text-text">
          {log.message}
        </span>
        {log.data && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-border rounded"
          >
            {expanded ? <FiChevronDown /> : <FiChevronRight />}
          </button>
        )}
      </div>
      {expanded && log.data && (
        <pre className="mt-1 ml-32 p-2 bg-bg rounded border border-border overflow-x-auto text-[11px] text-text-muted">
          {JSON.stringify(log.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
