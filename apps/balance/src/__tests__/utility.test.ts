import testConfig, { aircraft1TestLoading, aircraft2TestLoading } from "./testConfig.ts"
import { describe, test, expect } from "vitest";
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateEmptyBalanceForConfig, calculateMAC, calculateMaxBalanceForConfig, getSortedByArm, getSortedByArmClosest, roundNumber, truncateNumber } from "../utility.ts";
import type { seatT } from "../Types.ts";

const config = JSON.parse(testConfig);
const loading1 = JSON.parse(aircraft1TestLoading);
const loading2 = JSON.parse(aircraft2TestLoading);

describe('Sorting positions on arm', () => {
  test('Get for seats of standard aircraft', () => {
    const seats = getSortedByArm(config.aircraft[0].seats) as seatT[];
    const seatIds = seats.map(s => s.id);
    expect(seatIds).toStrictEqual([
      '57708145-9605-46af-b0d4-7e58573c2f15',
      'fe68e486-56a7-43d8-97bf-7e11936f1227',
    ]);
  });
  test('Get for seats of aircraft with negative arms', () => {
    const seats = getSortedByArm(config.aircraft[1].seats) as seatT[];
    const seatIds = seats.map(s => s.id);
    expect(seatIds).toStrictEqual([
      "30169e82-1cf8-429f-a3ec-0dc9f7519485",
      "66b43b4d-68bb-4309-87c0-867c4801f4a6",
      "9bb1884c-2fe7-4adf-a386-3f5c6995a936",
      "d7792403-8e81-4623-8c0d-5a735a6671e0",
      "a7333113-bb9d-4e32-b6b2-47e537cfbe36",
      "a98e3cf4-6d31-40dc-824e-efb2efb50c00",
      "afd216f7-a9a6-4181-a402-5853c905a38a",
      "1b9357be-c99b-446c-a07b-a2f4e89c73df",
      "859c9362-20b5-41e3-b7e3-1ac9fa1616dd",
      "e29de0cc-9599-4cf8-865c-95db3acfe812",
      "cd1c6c43-c516-4c16-9c5b-7f523297285b",
      "0c9fa845-bd09-4928-b764-7687d655f618",
      "6a72e513-a2b6-446d-8605-7b893637e777",
      "33407075-a958-4458-9aed-1afe10e25641",
      "86bf1079-f48b-4c80-80ef-ad0de5feb9c6",
      "94f23547-abab-42b3-9220-a1912e64c2be",
      "39706b2b-00b7-49e8-aeac-7bfbc90be244",
      "c2665776-0600-4cbd-a8dd-c9d4f452e6b8",
      "808510fb-d27a-4a9c-8ba4-b5c7bc79fb78",
      "7f4b606a-766e-4f24-af62-cc950b76c9d1",
    ]);
  });
});

describe('Sorting positions on arm around point', () => {
  test('Get for seats of standard aircraft', () => {
    const seats = getSortedByArmClosest(config.aircraft[0].seats, 80) as seatT[];
    const seatIds = seats.map(s => s.id);
    expect(seatIds).toStrictEqual([
      'fe68e486-56a7-43d8-97bf-7e11936f1227',
      '57708145-9605-46af-b0d4-7e58573c2f15',
    ]);
  });
  test('Get for seats of aircraft with negative arms', () => {
    const seats = getSortedByArmClosest(config.aircraft[1].seats, 65) as seatT[];
    const seatIds = seats.map(s => s.id);
    expect(seatIds).toStrictEqual([
      "0c9fa845-bd09-4928-b764-7687d655f618",
      "e29de0cc-9599-4cf8-865c-95db3acfe812",
      "cd1c6c43-c516-4c16-9c5b-7f523297285b",
      "6a72e513-a2b6-446d-8605-7b893637e777",
      "33407075-a958-4458-9aed-1afe10e25641",
      "859c9362-20b5-41e3-b7e3-1ac9fa1616dd",
      "1b9357be-c99b-446c-a07b-a2f4e89c73df",
      "afd216f7-a9a6-4181-a402-5853c905a38a",
      "86bf1079-f48b-4c80-80ef-ad0de5feb9c6",
      "a98e3cf4-6d31-40dc-824e-efb2efb50c00",
      "94f23547-abab-42b3-9220-a1912e64c2be",
      "39706b2b-00b7-49e8-aeac-7bfbc90be244",
      "a7333113-bb9d-4e32-b6b2-47e537cfbe36",
      "d7792403-8e81-4623-8c0d-5a735a6671e0",
      "9bb1884c-2fe7-4adf-a386-3f5c6995a936",
      "66b43b4d-68bb-4309-87c0-867c4801f4a6",
      "c2665776-0600-4cbd-a8dd-c9d4f452e6b8",
      "808510fb-d27a-4a9c-8ba4-b5c7bc79fb78",
      "7f4b606a-766e-4f24-af62-cc950b76c9d1",
      "30169e82-1cf8-429f-a3ec-0dc9f7519485",
    ]);
  });
});

describe('Calculate MAC from Arm', () => {
  test('Calculate MAC from middle', () => {
    // 0--[10]-(50)----50
    expect(calculateMAC(10, 50, 0, true)).toBe(20);
  });
  test('Calculate MAC from before start', () => {
    // [-10]---0----(50)----50
    expect(calculateMAC(-10, 50, 0, true)).toBe(-20);
  });
  test('Calculate MAC with non zero start', () => {
    // [0]----------50-----(50)-----100
    expect(calculateMAC(0, 50, 50, true)).toBe(-100);
  });
  test('Calculate MAC from far past end', () => {
    // 0-(10)-10----------------[120]
    expect(calculateMAC(120, 10, 0, true)).toBe(1200);
  });
  test('Calculate MAC with 0 length', () => {
    // 0
    expect(calculateMAC(120, 0, 0, true)).toBe(120);
  });
});

describe('Calculate Empty Balance For Config', () => {
  test('Calculate Empty Balance Standard Aircraft', () => {
    // Test aircraft 1
    expect(calculateEmptyBalanceForConfig(config.aircraft[0], config.aircraft[0].aircraftConfigs[0].id)).toStrictEqual([1550, 35.5]);
  });
  test('Calculate Empty Balance For Aircraft with negative weights', () => {
    // Test aircraft 2 Config 1
    expect(calculateEmptyBalanceForConfig(config.aircraft[1], config.aircraft[1].aircraftConfigs[0].id)).toStrictEqual([1676, 35.26551312649165]);
  });
  test('Calculate Empty Balance For Extreme Aircraft config', () => {
    // Test aircraft 2 Config 2
    expect(calculateEmptyBalanceForConfig(config.aircraft[1], config.aircraft[1].aircraftConfigs[1].id)).toStrictEqual([1596, 36.34398496240601]);
  });
});

describe('Calculate Max Balance For Config', () => {
  test('Calculate Max Balance For Standard Aircraft', () => {
    expect(calculateMaxBalanceForConfig(config.aircraft[0], config.aircraft[0].aircraftConfigs[0].id)).toStrictEqual([2520, 46.25992063492063]);
  });
  test('Calculate Max Balance For Aircraft with negative weights', () => {
    expect(calculateMaxBalanceForConfig(config.aircraft[1], config.aircraft[1].aircraftConfigs[0].id)).toStrictEqual([17900, 77.2304469273743]);
  });
});

describe('Calculate Balance For Ops Config', () => {
  test('Calculate Ops Balance For Standard Aircraft', () => {
    expect(calculateBalanceForOperationConfig(config.aircraft[0], config.aircraft[0].operationConfigs[0].id)).toStrictEqual([1770, 36.34180790960452]);
  });
  test('Calculate Ops Balance For Aircraft with negative weights', () => {
    expect(calculateBalanceForOperationConfig(config.aircraft[1], config.aircraft[1].operationConfigs[0].id)).toStrictEqual([3220, 36.854968944099376]);
  });
});

describe('Calculate Balance For Takeoff', () => {
  test('Calculate Takeoff Balance For Standard Aircraft', () => {
    expect(calculateBalanceForTakeoff(config.aircraft[0], config.aircraft[0].operationConfigs[0].id, loading1)).toStrictEqual([2265, 42.40618101545254]);
  });
  test('Calculate Takeoff Balance For Aircraft with negative weights', () => {
    expect(calculateBalanceForTakeoff(config.aircraft[1], config.aircraft[1].operationConfigs[0].id, loading2)).toStrictEqual([7904, 57.33970141700405]);
  });
});

describe('Calculate Balance For Landing', () => {
  test('Calculate Landing Balance For Standard Aircraft', () => {
    expect(calculateBalanceForLanding(config.aircraft[0], config.aircraft[0].operationConfigs[0].id, loading1)).toStrictEqual([2265, 42.40618101545254]);
  });
  test('Calculate Landing Balance For Aircraft with negative weights', () => {
    expect(calculateBalanceForLanding(config.aircraft[1], config.aircraft[1].operationConfigs[0].id, loading2)).toStrictEqual([7724, 56.81162610046608]);
  });
});

describe('Test number truncating', () => {
  test('Truncate whole number', () => {
    expect(truncateNumber(100, 1000)).toBe(100);
  });
  test('Truncate shorter than precision', () => {
    expect(truncateNumber(100.45, 1000)).toBe(100.45);
  });
  test('Truncate longer than precision', () => {
    expect(truncateNumber(100.45543, 1000)).toBe(100.455);
  });
  test('Truncate negative than precision', () => {
    expect(truncateNumber(-100.45543, 1000)).toBe(-100.455);
  });
});

describe('Test number rounding', () => {
  test('Round whole number', () => {
    expect(roundNumber(100, 1000)).toBe(100);
  });
  test('Round shorter than precision', () => {
    expect(roundNumber(100.45, 1000)).toBe(100.45);
  });
  test('Round longer than precision', () => {
    expect(roundNumber(100.45593, 1000)).toBe(100.456);
  });
  test('Round negative than precision', () => {
    expect(roundNumber(-100.45583, 1000)).toBe(-100.456);
  });
});

