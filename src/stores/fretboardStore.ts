import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Midi } from '../theory/pitch';
import type { ScaleId } from '../theory/scales';

export type StringOrientation = '1-top' | '6-top';
export type LabelMode = 'none' | 'all' | 'natural' | 'tapped';
export type OverlayMode = 'off' | 'degree' | 'scale';
export type ScaleLabelMode = 'degree' | 'note';
export type PositionBoxSelection = 'all' | 1 | 2 | 3 | 4 | 5;
export type ZoomFrets = 12 | 15 | 22;

interface DegreeState {
  rootMidi: Midi | null;
  degrees: number[];
}

interface ScaleState {
  rootPc: number;
  scaleId: ScaleId;
}

interface FretboardState {
  stringOrientation: StringOrientation;
  zoomFrets: ZoomFrets;
  labelMode: LabelMode;
  overlayMode: OverlayMode;
  degree: DegreeState;
  scale: ScaleState;
  scaleLabelMode: ScaleLabelMode;
  positionBox: PositionBoxSelection;

  setStringOrientation: (o: StringOrientation) => void;
  setZoomFrets: (z: ZoomFrets) => void;
  setLabelMode: (m: LabelMode) => void;
  setOverlayMode: (m: OverlayMode) => void;
  setDegreeRoot: (midi: Midi) => void;
  toggleDegree: (semitone: number) => void;
  setDegreesFromPreset: (degrees: number[]) => void;
  clearDegrees: () => void;
  setScaleRoot: (rootPc: number) => void;
  setScaleType: (scaleId: ScaleId) => void;
  setScaleLabelMode: (m: ScaleLabelMode) => void;
  setPositionBox: (b: PositionBoxSelection) => void;
}

export const useFretboardStore = create<FretboardState>()(
  persist(
    (set) => ({
      stringOrientation: '1-top',
      zoomFrets: 12,
      labelMode: 'natural',
      overlayMode: 'off',
      degree: { rootMidi: null, degrees: [] },
      scale: { rootPc: 0, scaleId: 'major' },
      scaleLabelMode: 'degree',
      positionBox: 'all',

      setStringOrientation: (o) => set({ stringOrientation: o }),
      setZoomFrets: (z) => set({ zoomFrets: z }),
      setLabelMode: (m) => set({ labelMode: m }),
      setOverlayMode: (m) => set({ overlayMode: m }),

      setDegreeRoot: (midi) =>
        set((s) => ({ degree: { rootMidi: midi, degrees: s.degree.degrees.length ? s.degree.degrees : [0] } })),

      toggleDegree: (semitone) =>
        set((s) => {
          const has = s.degree.degrees.includes(semitone);
          const degrees = has ? s.degree.degrees.filter((d) => d !== semitone) : [...s.degree.degrees, semitone].sort((a, b) => a - b);
          return { degree: { ...s.degree, degrees } };
        }),

      setDegreesFromPreset: (degrees) => set((s) => ({ degree: { ...s.degree, degrees: [...degrees] } })),

      clearDegrees: () => set({ degree: { rootMidi: null, degrees: [] } }),

      setScaleRoot: (rootPc) => set((s) => ({ scale: { ...s.scale, rootPc: ((rootPc % 12) + 12) % 12 } })),
      setScaleType: (scaleId) => set((s) => ({ scale: { ...s.scale, scaleId } })),
      setScaleLabelMode: (m) => set({ scaleLabelMode: m }),
      setPositionBox: (b) => set({ positionBox: b }),
    }),
    { name: 'fretlab-fretboard' },
  ),
);
