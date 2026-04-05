import { useEffect, useCallback, useRef, useState } from "react";
import {
  PlugZap, Wifi, WifiOff, RefreshCw, ChevronDown, RotateCcw, Save, Terminal
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  getDeviceConfig,
  updateDeviceConfig,
  connectDevice,
  disconnectDevice,
  getAvailablePorts,
  getStatus,
} from "../services/spoilageService";

/* ── Reusable sub-components ───────────────────────────────────────── */

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-emerald-400 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-white font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

/**
 * GlassDropdown — a fully custom dropdown with dark glassmorphism styling.
 * Accepts `options` as [{ value, label }] and calls `onChange(value)`.
 */
function GlassDropdown({ id, value, onChange, options = [], disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className={`relative ${disabled ? "opacity-40 pointer-events-none" : ""}`} id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm
                    bg-white/5 border transition-all duration-200 text-left
                    ${open
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                      : "border-white/10 hover:border-white/20"
                    }`}
      >
        <span className="text-white truncate pr-2">
          {selected?.label ?? value ?? "Select…"}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10
                     bg-[#111315]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
          style={{ animation: "dropIn 0.15s ease-out" }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
            {options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between
                              transition-colors duration-100 group
                              ${
                                isActive
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "text-gray-300 hover:bg-white/8 hover:text-white"
                              }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && (
                    <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400
                                     shadow-[0_0_6px_rgba(52,211,153,0.8)] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ id, checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0
          ${checked
            ? "bg-emerald-500/80 border-emerald-400/60 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
            : "bg-white/5 border-white/15"
          }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
                      transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function StatusDot({ connected }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${connected
          ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"
          : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"}`}
      />
      <span className={connected ? "text-emerald-400" : "text-red-400"}>
        {connected ? "Connected" : "Disconnected"}
      </span>
    </span>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function SettingsPage() {
  // Config form state
  const [port,          setPort]          = useState("COM5");
  const [baud,          setBaud]          = useState(115200);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [manualDiscon,  setManualDiscon]  = useState(false);
  const [jetsonConfig,  setJetsonConfig]  = useState("");

  // UX state
  const [ports,       setPorts]       = useState([]);
  const [bauds,       setBauds]       = useState([]);
  const [devStatus,   setDevStatus]   = useState(null);  // from /status
  const [saving,      setSaving]      = useState(false);
  const [connecting,  setConnecting]  = useState(false);
  const [scanningPorts, setScanningPorts] = useState(false);
  const [feedback,    setFeedback]    = useState(null);  // {type, msg}
  const [dirty,       setDirty]       = useState(false); // unsaved changes

  const statusTimerRef = useRef(null);

  // ── Load config + ports on mount ────────────────────────────────────
  useEffect(() => {
    loadConfig();
    loadPorts();
    startStatusPoll();
    return () => clearInterval(statusTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConfig() {
    try {
      const cfg = await getDeviceConfig();
      setPort(cfg.port);
      setBaud(cfg.baud);
      setAutoReconnect(cfg.auto_reconnect);
      setManualDiscon(cfg.manual_disconnect);
      setDirty(false);
    } catch {
      showFeedback("error", "Could not load device config.");
    }
  }

  async function loadPorts() {
    setScanningPorts(true);
    try {
      const data = await getAvailablePorts();
      setPorts(data.ports ?? []);
      setBauds(data.common_bauds ?? []);
    } catch {
      showFeedback("error", "Could not enumerate serial ports.");
    } finally {
      setScanningPorts(false);
    }
  }

  function startStatusPoll() {
    const poll = async () => {
      try {
        const s = await getStatus();
        setDevStatus(s);
      } catch { /* silently ignore */ }
    };
    poll();
    statusTimerRef.current = setInterval(poll, 3000);
  }

  // ── Show feedback banner (auto-dismiss) ─────────────────────────────
  function showFeedback(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  // ── Save config ──────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      await updateDeviceConfig({ port, baud, auto_reconnect: autoReconnect });
      setDirty(false);
      showFeedback("success", "Configuration saved. Serial listener restarting…");
    } catch {
      showFeedback("error", "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  // ── Connect / Disconnect toggle ──────────────────────────────────────
  async function handleConnectionToggle() {
    setConnecting(true);
    try {
      if (manualDiscon) {
        await connectDevice();
        setManualDiscon(false);
        showFeedback("success", "Connect signal sent. Attempting to open port…");
      } else {
        await disconnectDevice();
        setManualDiscon(true);
        showFeedback("success", "Disconnect signal sent. Port will close shortly.");
      }
    } catch {
      showFeedback("error", "Connection toggle failed.");
    } finally {
      setConnecting(false);
    }
  }

  // ── Mark form dirty when user edits ─────────────────────────────────
  const onPortChange = useCallback((v) => { setPort(v);        setDirty(true); }, []);
  const onBaudChange = useCallback((v) => { setBaud(Number(v)); setDirty(true); }, []);
  function onAutoChange(v)  { setAutoReconnect(v); setDirty(true); }

  // ── Dropdown option arrays ────────────────────────────────────────────
  const portOptions = [
    port,
    ...ports.map((p) => p.port).filter((p) => p !== port),
  ].map((p) => {
    const info = ports.find((x) => x.port === p);
    return {
      value: p,
      label: info?.description && info.description !== p ? `${p} — ${info.description}` : p,
    };
  });

  const baudOptions = (bauds.length ? bauds : [9600, 115200]).map((b) => ({
    value: b,
    label: String(b),
  }));

  const isConnected = devStatus?.connected ?? false;

  return (
    <DashboardLayout>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Hardware configuration &amp; connection control</p>
        </div>

        {/* Live device status pill */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <span className="text-xs text-gray-500 mr-1">Device</span>
          <StatusDot connected={isConnected} />
        </div>
      </div>

      {/* ── Feedback banner ── */}
      {feedback && (
        <div
          className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm
            ${feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
              : "bg-red-500/10 border-red-500/25 text-red-300"
            }`}
        >
          <span className="text-base">{feedback.type === "success" ? "✓" : "⚠"}</span>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ════════════════════════════════════════════════
            Card 1 — Device Configuration
        ════════════════════════════════════════════════ */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <SectionHeader
            icon={<PlugZap size={18} />}
            title="Device Configuration"
            subtitle="Control which serial port and baud rate the backend uses"
          />

          {/* Serial Port */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel>Serial Port</FieldLabel>
              <button
                id="refresh-ports-btn"
                onClick={loadPorts}
                disabled={scanningPorts}
                title="Refresh available ports"
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-emerald-400
                           transition-colors disabled:opacity-40"
              >
                <RefreshCw size={11} className={scanningPorts ? "animate-spin" : ""} />
                {scanningPorts ? "Scanning…" : "Refresh"}
              </button>
            </div>

            <GlassDropdown
              id="port-select"
              value={port}
              onChange={onPortChange}
              options={portOptions}
            />

            {ports.length === 0 && !scanningPorts && (
              <p className="text-[11px] text-yellow-500/70 mt-1.5">
                No ports detected. Make sure the device is plugged in, then refresh.
              </p>
            )}
          </div>

          {/* Baud Rate */}
          <div className="mb-6">
            <FieldLabel>Baud Rate</FieldLabel>
            <GlassDropdown
              id="baud-select"
              value={baud}
              onChange={onBaudChange}
              options={baudOptions}
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              id="save-config-btn"
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                          transition-all duration-200 border
                          ${dirty
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-white/5 border-white/10 text-gray-600 cursor-not-allowed"
                          }`}
            >
              <Save size={14} />
              {saving ? "Saving…" : dirty ? "Save Changes" : "Saved"}
            </button>

            {dirty && (
              <button
                id="discard-config-btn"
                onClick={loadConfig}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <RotateCcw size={11} /> Discard
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            Card 2 — Connection Control
        ════════════════════════════════════════════════ */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <SectionHeader
            icon={isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
            title="Connection Control"
            subtitle="Manually manage the serial port connection"
          />

          {/* Connection status detail */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <StatusDot connected={isConnected} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Port</span>
              <span className="text-white font-mono">{port}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Baud</span>
              <span className="text-white font-mono">{baud}</span>
            </div>
            {devStatus?.elapsed_s != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Uptime</span>
                <span className="text-white">{devStatus.elapsed_s}s</span>
              </div>
            )}
            {devStatus?.ready != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ready</span>
                <span className={devStatus.ready ? "text-emerald-400" : "text-yellow-400"}>
                  {devStatus.ready ? "Yes" : "Warming up…"}
                </span>
              </div>
            )}
          </div>

          {/* Connect / Disconnect big button */}
          <button
            id="connection-toggle-btn"
            onClick={handleConnectionToggle}
            disabled={connecting}
            className={`w-full py-3 rounded-xl font-semibold text-sm border transition-all duration-300
              flex items-center justify-center gap-2 mb-5
              ${manualDiscon
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25"
              }
              ${connecting ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {connecting
              ? <RefreshCw size={16} className="animate-spin" />
              : manualDiscon
                ? <><Wifi size={16} /> Connect to {port}</>
                : <><WifiOff size={16} /> Disconnect</>
            }
          </button>

          {/* Auto-reconnect toggle */}
          <Toggle
            id="auto-reconnect-toggle"
            checked={autoReconnect}
            onChange={onAutoChange}
            label="Auto-Reconnect"
            description="Automatically retry when the device disconnects unexpectedly"
          />
        </div>

        {/* ════════════════════════════════════════════════
            Card 3 — Jetson Nano Configuration
        ════════════════════════════════════════════════ */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 xl:col-span-2">
          <SectionHeader
            icon={<Terminal size={18} />}
            title="Jetson Nano Config"
            subtitle="Custom input variable for backend task configuration"
          />

          <div>
            <FieldLabel>Configuration Input</FieldLabel>
            <input
              type="text"
              value={jetsonConfig}
              onChange={(e) => {
                setJetsonConfig(e.target.value);
                setDirty(true);
              }}
              placeholder="Enter config parameters here..."
              className="w-full bg-[#111315]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
            />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
