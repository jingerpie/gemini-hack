import type { ChipState } from "../App";
import { fmtMs } from "./Timeline";

type Props = {
  chip: ChipState;
  chipDetail: string;
  mock: boolean;
  verifyEnabled: boolean;
  onVerify(on: boolean): void;
  onUndo(): void;
  stats: { last: number | null; median: number | null; jobs: number };
};

const CHIP_LABEL: Record<ChipState, string> = {
  idle: "idle",
  connecting: "connecting",
  listening: "listening",
  fallback: "fallback · type below",
};

export function Hud({ chip, chipDetail, mock, verifyEnabled, onVerify, onUndo, stats }: Props) {
  return (
    <>
      <div className="hud hud-left">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M2 13V5.5L8 2l6 3.5V13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M5.5 13V8.5h5V13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-name">Studio</span>
          <span className="brand-sub">voice-driven interiors</span>
        </div>
        <span className={`chip chip-${chip}`} title={chipDetail || undefined}>
          <i />
          {CHIP_LABEL[chip]}
        </span>
        {mock && <span className="chip chip-mock">mock</span>}
      </div>
      <div className="hud hud-right">
        <div className="readout" title="orchestrator round-trip latency">
          <div>
            <span className="readout-k">last</span>
            <span className="readout-v">{stats.last == null ? "—" : fmtMs(stats.last)}</span>
          </div>
          <div>
            <span className="readout-k">median</span>
            <span className="readout-v">{stats.median == null ? "—" : fmtMs(stats.median)}</span>
          </div>
          <div>
            <span className="readout-k">jobs</span>
            <span className={`readout-v ${stats.jobs ? "readout-live" : ""}`}>{stats.jobs}</span>
          </div>
        </div>
        <button
          className={`toggle ${verifyEnabled ? "on" : ""}`}
          onClick={() => onVerify(!verifyEnabled)}
          title="After each change, screenshot the room and check it against what you asked"
        >
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          Verify
        </button>
        <button className="btn" onClick={onUndo} title="Undo (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M4.5 3 1.8 5.7l2.7 2.7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 5.7h6.2a3.6 3.6 0 0 1 0 7.2H5.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Undo
        </button>
      </div>
    </>
  );
}
