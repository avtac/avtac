
export interface Controls {
  width: number;
  searchAngle: number;
  centerlineOffset: number;
  climbGradient: number;
  elevation: number;
  crossingHeight: number;
  view: boolean;
  showOriginal: boolean;

  height: number;
  runwayOffset: number;
  aspect: number;
  profileScale: number;
}

export interface SetControls {
  width: (arg0: number) => void;
  searchAngle: (arg0: number) => void;
  centerlineOffset: (arg0: number) => void;
  climbGradient: (arg0: number) => void;
  elevation: (arg0: number) => void;
  crossingHeight: (arg0: number) => void;
  runwayOffset: (arg0: number) => void;
  view: (arg0: boolean) => void;
  showOriginal: (arg0: boolean) => void;
}

