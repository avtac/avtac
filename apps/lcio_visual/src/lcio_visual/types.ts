// This is where all types are saved

export interface objectData {
  type: string;
  distance: string;
  offset: string;
  height: string;
  original: string;
}

export interface runwayIdentifier {
  id: number;
  side: "R" | "C" | "L" | undefined;
}

export interface VisualizerData {
  type: string;
  beginning: boolean;
  distance: number;
  offset: number;
  offsetDir: "left" | "right" | "on";
  msl: number;
  aglOriginal: number | null;
  agl: number;
  danger: boolean;
  original: string;
  runway: runwayIdentifier;
  selected: boolean;
}
