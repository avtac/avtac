import { type Controls } from "./controls";
import { type runwayIdentifier } from "./types";

export function withinAngle(controls: Controls, x: number, y: number) {
  const angelY = x * Math.tan(controls.searchAngle / 180 * Math.PI);
  return Math.abs(y) < angelY + controls.centerlineOffset;
}

export function aboveClimbGradient(controls: Controls, x: number, z: number) {
  const grade = (z - controls.crossingHeight) / x * 6070;
  return controls.climbGradient < grade;
}

export function requiredShortening(controls: Controls) {
  const requiredClimb = controls.crossingHeight / controls.climbGradient * 6070;
  return requiredClimb;
}

export function directionToSign(direction: string): number {
  return direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
}

// Convert interval to spacing of 1, 2, or 5 * 10^x
export function getCleanInterval(width: number, desiredTicks: number): number {
  const desiredInterval = (width / desiredTicks);
  const power = Math.ceil(Math.log10(desiredInterval))
  const spacing = desiredInterval / Math.pow(10, power - 1);
  const number = (spacing < 5 ? (spacing < 2 ? 1 : 2) : 5) * Math.pow(10, power - 1);
  return number;
}

export function getRunwayNumber(id: string): runwayIdentifier {
  const regex = /(?<number>\d+)(?<direction>[LRC])?/;
  const matches = id.match(regex);
  if (!matches || !matches.groups) return { id: 0, side: undefined } as runwayIdentifier;
  return { id: Number(matches.groups['number']), side: matches.groups['direction'] } as runwayIdentifier;
}

export function inverseRunwayNumber(id: runwayIdentifier) {
  let side = ""
  switch (id.side) {
    case "R":
      side = "L";
      break;
    case "L":
      side = "R";
      break;
    case "C":
      side = "C";
  }

  // Rotate by 180 degrees and make sure 0 is shown as 36
  const number = ((Number(id.id) + 18 - 1) % 36) + 1;
  return (`${number}${side}`);

}
