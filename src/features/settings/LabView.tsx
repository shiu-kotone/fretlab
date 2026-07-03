import { StringTestButtons } from './StringTestButtons';
import { SettingsPanel } from './SettingsPanel';

/** ラボ tab: settings (SPEC §5.8, foundation only) plus the Phase 0 audio-path test buttons. */
export function LabView() {
  return (
    <div style={{ padding: '0 16px' }}>
      <StringTestButtons />
      <SettingsPanel />
    </div>
  );
}
