import { createContext, type Context } from 'react'
import { fuelUnits, lengthUnits, volumeUnits, weightUnits, type fuelUnitsT, type lengthUnitsT, type setupT, type volumeUnitsT, type weightUnitsT } from './Types';

export const unitPrecision = 10000 as const;

export const weightUnitsElements = weightUnits.map((u) => <option key={u} value={u}>{u}</option>)
export const lengthUnitsElements = lengthUnits.map((u) => <option key={u} value={u}>{u}</option>)
export const fuelUnitsElements = fuelUnits.map((u) => <option key={u} value={u}>{u}</option>)

// These are saved in the lbs/gal and then converted to appropriate units
export const fuelTypes: { name: string, density: number }[] = [
  { name: '100LL', density: 6 },
  { name: 'Jet A', density: 6.6 },
  { name: 'JP-8', density: 6.5 },
  { name: 'Other', density: 0 },
] as const

const weightUnitsToPounds: { [K in weightUnitsT]: number } = {
  "kg": 2.2046226218,
  "g": 0.0022046226218,
  "lbs": 1,
  "oz": 1 / 16,
}

export function convertWeightUnit(value: number, oldUnit: weightUnitsT, newUnit: weightUnitsT): number {
  if (oldUnit === newUnit) return value;
  const inPounds = value * weightUnitsToPounds[oldUnit];
  return inPounds / weightUnitsToPounds[newUnit];
}

const lengthUnitsFromIn: { [K in lengthUnitsT]: number } = {
  "in": 1,
  "ft": 1 / 12,
  "m": 0.0254,
  "cm": 2.54,
  "mm": 25.4,
}

export function convertLengthUnit(value: number, oldUnit: lengthUnitsT, newUnit: lengthUnitsT): number {
  if (oldUnit === newUnit) return value;
  const inInches = value / lengthUnitsFromIn[oldUnit];
  return inInches * lengthUnitsFromIn[newUnit];
}

const volumeUnitsToGallons: { [K in volumeUnitsT]: number } = {
  "gal": 1,
  "ml": 0.000264172052358,
  "liters": 0.264172052358,
}

export function convertVolumeUnits(value: number, oldUnit: volumeUnitsT, newUnit: volumeUnitsT): number {
  if (oldUnit === newUnit) return value;
  const inGallons = value * volumeUnitsToGallons[oldUnit];
  return inGallons / volumeUnitsToGallons[newUnit];
}

export function convertFuelUnits(value: number, oldUnit: fuelUnitsT, newUnit: fuelUnitsT, density: number): number {
  if (oldUnit === newUnit) return value;
  if (volumeUnits.includes(oldUnit as volumeUnitsT) && volumeUnits.includes(newUnit as volumeUnitsT)) {
    return convertVolumeUnits(value, oldUnit as volumeUnitsT, newUnit as volumeUnitsT);
  }
  if (weightUnits.includes(oldUnit as weightUnitsT) && weightUnits.includes(newUnit as weightUnitsT)) {
    return convertWeightUnit(value, oldUnit as weightUnitsT, newUnit as weightUnitsT);
  }
  if (density === 0) {
    console.error("ERROR: converting Fuel volume with density of 0");
  }
  if (weightUnits.includes(oldUnit as weightUnitsT))
    // Weight to volume
    return convertVolumeUnits(convertWeightUnit(value, oldUnit as weightUnitsT, 'lbs') / density, 'gal', newUnit as volumeUnitsT);
  else
    return convertWeightUnit(convertVolumeUnits(value, oldUnit as volumeUnitsT, 'gal') * density, 'lbs', newUnit as weightUnitsT);
}

export function convertDensityUnits(value: number, oldUnitVolume: volumeUnitsT, oldUnitWeight: weightUnitsT, newUnitVolume: volumeUnitsT, newUnitWeight: weightUnitsT): number {
  if (oldUnitVolume === newUnitVolume && oldUnitWeight === newUnitWeight) return value;
  value = value / convertVolumeUnits(1, oldUnitVolume, newUnitVolume);
  value = value * convertWeightUnit(1, oldUnitWeight, newUnitWeight);
  return value;
}

export const UnitContext: Context<setupT> = createContext({
  weightUnits: 'lbs',
  lengthUnits: 'in',
  fuelUnits: 'gal',
  useMAC: false,
  fuelDensity: 6,
} as setupT);
