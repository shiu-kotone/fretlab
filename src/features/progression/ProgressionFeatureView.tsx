import { useEffect } from 'react';
import { useProgressionStore } from '../../stores/progressionStore';
import { useProgressionUiStore } from '../../stores/progressionUiStore';
import { PRESET_PROGRESSIONS, isPresetProgressionId } from '../../data/presetProgressions';
import { ProgressionListView } from './ProgressionListView';
import { ProgressionEditor } from './ProgressionEditor';
import { ProgressionPlayerView } from './ProgressionPlayerView';
import type { Progression } from '../../data/progressionTypes';

/** SPEC §5.3: preset + user progressions, routed between list/editor/player. */
export function ProgressionFeatureView() {
  const screen = useProgressionUiStore((s) => s.screen);
  const selectedId = useProgressionUiStore((s) => s.selectedId);
  const openList = useProgressionUiStore((s) => s.openList);
  const openEditor = useProgressionUiStore((s) => s.openEditor);
  const openPlayer = useProgressionUiStore((s) => s.openPlayer);

  const items = useProgressionStore((s) => s.items);
  const loaded = useProgressionStore((s) => s.loaded);
  const load = useProgressionStore((s) => s.load);
  const create = useProgressionStore((s) => s.create);
  const update = useProgressionStore((s) => s.update);
  const duplicate = useProgressionStore((s) => s.duplicate);
  const remove = useProgressionStore((s) => s.remove);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const all: Progression[] = [...PRESET_PROGRESSIONS, ...items];
  const selected = selectedId ? all.find((p) => p.id === selectedId) ?? null : null;

  if (screen === 'list' || !selected) {
    return (
      <ProgressionListView
        presets={PRESET_PROGRESSIONS}
        userProgressions={items}
        onOpenPlayer={openPlayer}
        onOpenEditor={openEditor}
        onCreate={async () => {
          const p = await create('新しい進行');
          openEditor(p.id);
        }}
        onDuplicate={async (p) => {
          const copy = await duplicate(p);
          openEditor(copy.id);
        }}
        onDelete={remove}
      />
    );
  }

  const isPreset = isPresetProgressionId(selected.id);

  if (screen === 'editor') {
    return (
      <ProgressionEditor
        progression={selected}
        readOnly={isPreset}
        onSave={async (p) => {
          await update(p);
        }}
        onDuplicateAndEdit={async () => {
          const copy = await duplicate(selected);
          openEditor(copy.id);
        }}
        onPlay={async (p) => {
          if (!isPreset) await update(p);
          openPlayer(isPreset ? selected.id : p.id);
        }}
        onBack={openList}
      />
    );
  }

  return <ProgressionPlayerView progression={selected} onEdit={() => openEditor(selected.id)} onBack={openList} />;
}
