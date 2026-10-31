export const aircraft1TestLoading = `{
    "fuel": [],
    "passengers": [
        {
            "location": "57708145-9605-46af-b0d4-7e58573c2f15",
            "avgWeight": 200,
            "count": 1
        },
        {
            "location": "fe68e486-56a7-43d8-97bf-7e11936f1227",
            "avgWeight": 200,
            "count": 1
        }
    ],
    "cargo": [
        {
            "location": "a55ec43e-1e7f-4f3d-9d8f-b3d1ca1114f1",
            "weight": 70
        },
        {
            "location": "e815e3a5-7ec3-46d8-b91d-34ec1cfb2f4a",
            "weight": 25
        }
    ]
}`

export const aircraft2TestLoading = `{
    "fuel": [
        {
            "tank": "230891cd-8352-4523-be6f-a21fbf1dc327",
            "tripFuel": 132,
            "loadedFuel": 270
        },
        {
            "tank": "430891cd-8352-4523-be6f-a21fbf1dc327",
            "tripFuel": 48,
            "loadedFuel": 90
        }
    ],
    "passengers": [
        {
            "location": "30169e82-1cf8-429f-a3ec-0dc9f7519485",
            "avgWeight": -200,
            "count": -1
        },
        {
            "location": "66b43b4d-68bb-4309-87c0-867c4801f4a6",
            "avgWeight": 300,
            "count": 2
        },
        {
            "location": "9bb1884c-2fe7-4adf-a386-3f5c6995a936",
            "avgWeight": 300,
            "count": 2
        },
        {
            "location": "a98e3cf4-6d31-40dc-824e-efb2efb50c00",
            "avgWeight": 300,
            "count": 2
        },
        {
            "location": "859c9362-20b5-41e3-b7e3-1ac9fa1616dd",
            "avgWeight": 300,
            "count": 2
        },
        {
            "location": "0c9fa845-bd09-4928-b764-7687d655f618",
            "avgWeight": 300,
            "count": 3
        },
        {
            "location": "94f23547-abab-42b3-9220-a1912e64c2be",
            "avgWeight": 300,
            "count": 2
        }
    ],
    "cargo": [
        {
            "location": "1e9faa7c-9e5a-444b-9198-b076b229f71f",
            "weight": -101
        },
        {
            "location": "b74ad7be-f593-47b5-bd13-966d515ded9f",
            "weight": 34
        },
        {
            "location": "82c9ee7c-750f-4ecb-9ff3-68c20b1b20f3",
            "weight": 25
        },
        {
            "location": "9fa585a6-2c99-45d9-862b-3713551519b3",
            "weight": 55
        },
        {
            "location": "208cfe15-16a1-4a4d-b903-3ddda2d36b05",
            "weight": 165
        },
        {
            "location": "83644e5e-ef62-4b55-a201-209ed2a2b637",
            "weight": 145
        }
    ]
}`

const testingConfig = `{
  "id": "3a96fb20-3e4f-4394-9b33-3542c7425f58",
  "name": "Cessna Config",
  "aircraft": [
    {
      "id": "3a96fb20-3e4f-4394-9b33-3542c7425f58",
      "config": {
        "tailNumber": "13273",
        "type": "C172",
        "emptyArm": 35.5,
        "emptyWeight": 1550,
        "mac": 58.8,
        "leadingEdgeMAC": 25.9
      },
      "seats": [
        {
          "id": "57708145-9605-46af-b0d4-7e58573c2f15",
          "name": "Pilot Seat",
          "arm": 37,
          "seatCount": 2,
          "lateralDist": 0,
          "maxWeight": 200
        },
        {
          "id": "fe68e486-56a7-43d8-97bf-7e11936f1227",
          "name": "Rear Passengers",
          "arm": 73,
          "seatCount": 2,
          "maxWeight": 200,
          "lateralDist": 0
        }
      ],
      "cargoAreas": [
        {
          "id": "a55ec43e-1e7f-4f3d-9d8f-b3d1ca1114f1",
          "name": "Baggage Area 1",
          "arm": 95,
          "maxWeight": 120
        },
        {
          "id": "e815e3a5-7ec3-46d8-b91d-34ec1cfb2f4a",
          "name": "Baggage Area 2",
          "arm": 123,
          "maxWeight": 50
        },
        {
          "id": "09a01e2c-72a4-430e-892c-c1cdf344039b",
          "name": "Baggage Rear Seats",
          "arm": 73,
          "maxWeight": 400
        }
      ],
      "fuelTanks": [],
      "limits": {
        "regions": [
          {
            "name": "Normal",
            "id": "ed5a0b5b-64d1-402a-aa4e-4e7e5a4e9ff8",
            "color": "#fe9090",
            "data": [
              {
                "id": "4d3ce18b-5862-4a9a-b5b4-faffad67dcba",
                "weight": 1500,
                "arm": 35
              },
              {
                "arm": 35,
                "weight": 1950,
                "id": "d65056a6-6ae7-4317-aafe-b9f529d97bb4"
              },
              {
                "id": "0d72e2b0-9943-4e54-98ae-f80ebecdb32c",
                "weight": 2550,
                "arm": 41
              },
              {
                "id": "c0afe591-8817-47f1-a2de-92f34589d7f0",
                "weight": 2550,
                "arm": 47.3
              },
              {
                "id": "0373d76a-775e-47e9-8212-5358716a8567",
                "weight": 1500,
                "arm": 47.3
              }
            ]
          },
          {
            "name": "Utility",
            "id": "1e4de586-5b30-4d36-b1f4-ae1c364ce00b",
            "color": "#000000",
            "data": [
              {
                "id": "5954f513-3eaf-4228-9f42-6c1f2beb382a",
                "weight": 1500,
                "arm": 35
              },
              {
                "id": "26e452b9-70ab-4c03-964d-83d97969004d",
                "weight": 1950,
                "arm": 35
              },
              {
                "id": "9f94ac2c-6e55-4b32-9b77-cdce0abe0375",
                "weight": 2200,
                "arm": 37.5
              },
              {
                "arm": 40.5,
                "weight": 2200,
                "id": "d1ad30f9-4745-4b40-8bd5-9c1ef8bbbb71"
              },
              {
                "id": "d5294e69-8b1a-4727-ab50-9c8a2830c649",
                "weight": 1500,
                "arm": 40.5
              }
            ]
          }
        ],
        "limits": [
          {
            "name": "MTOW",
            "id": "32469061-612e-4bce-9ab5-d8c4bc11eafe",
            "weight": 2550,
            "color": "#4481e4"
          }
        ]
      },
      "equipment": [],
      "aircraftConfigs": [
        {
          "id": "dfb67813-3bcd-4475-a074-568f2c0e7deb",
          "name": "Standard",
          "seats": [
            "57708145-9605-46af-b0d4-7e58573c2f15",
            "fe68e486-56a7-43d8-97bf-7e11936f1227"
          ],
          "cargoAreas": [
            "a55ec43e-1e7f-4f3d-9d8f-b3d1ca1114f1",
            "e815e3a5-7ec3-46d8-b91d-34ec1cfb2f4a"
          ],
          "equipment": [],
          "fuelTanks": []
        },
        {
          "id": "7dd20d29-2873-40b5-a721-104c0c8d9ca7",
          "name": "Cargo",
          "seats": [
            "57708145-9605-46af-b0d4-7e58573c2f15"
          ],
          "cargoAreas": [
            "a55ec43e-1e7f-4f3d-9d8f-b3d1ca1114f1",
            "e815e3a5-7ec3-46d8-b91d-34ec1cfb2f4a",
            "09a01e2c-72a4-430e-892c-c1cdf344039b"
          ],
          "equipment": [],
          "fuelTanks": []
        }
      ],
      "operationConfigs": [
        {
          "id": "eaaec1ba-66a7-4f90-a4bb-0fa9aa5e1275",
          "name": "1 Pilot Standard",
          "config": "dfb67813-3bcd-4475-a074-568f2c0e7deb",
          "seats": [
            {
              "id": "57708145-9605-46af-b0d4-7e58573c2f15",
              "weight": 200
            }
          ],
          "cargoAreas": [
            {
              "id": "a55ec43e-1e7f-4f3d-9d8f-b3d1ca1114f1",
              "weight": 20
            }
          ]
        },
        {
          "id": "d8050373-e61a-441b-b3a6-289cf5088990",
          "name": "Cargo",
          "config": "7dd20d29-2873-40b5-a721-104c0c8d9ca7",
          "seats": [
            {
              "id": "57708145-9605-46af-b0d4-7e58573c2f15",
              "weight": 200
            }
          ],
          "cargoAreas": [
            {
              "id": "e815e3a5-7ec3-46d8-b91d-34ec1cfb2f4a",
              "weight": 20
            }
          ]
        }
      ]
    },
    {
      "id": "a987b1ed-c82a-4bdc-9641-4a1044c6bc0b",
      "config": {
        "tailNumber": "AAA",
        "type": "123",
        "emptyArm": 35.5,
        "emptyWeight": 1550,
        "leadingEdgeMAC": 0,
        "mac": 0
      },
      "seats": [
        {
          "id": "30169e82-1cf8-429f-a3ec-0dc9f7519485",
          "name": "Pilot Seat",
          "arm": -37,
          "seatCount": -2,
          "lateralDist": 0,
          "maxWeight": -200
        },
        {
          "id": "6a72e513-a2b6-446d-8605-7b893637e777",
          "name": "Back Seat",
          "arm": 73,
          "seatCount": 0,
          "lateralDist": 0,
          "maxWeight": 0
        },
        {
          "id": "39706b2b-00b7-49e8-aeac-7bfbc90be244",
          "name": "New1",
          "arm": 100,
          "seatCount": 3,
          "maxWeight": "",
          "lateralDist": 0
        },
        {
          "id": "c2665776-0600-4cbd-a8dd-c9d4f452e6b8",
          "name": "New2",
          "arm": 120,
          "seatCount": "",
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "808510fb-d27a-4a9c-8ba4-b5c7bc79fb78",
          "name": "New3",
          "arm": 140,
          "seatCount": 3,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "7f4b606a-766e-4f24-af62-cc950b76c9d1",
          "name": "4New",
          "arm": 160,
          "seatCount": 3,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "1b9357be-c99b-446c-a07b-a2f4e89c73df",
          "name": "New5",
          "arm": 45,
          "seatCount": 3,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "0c9fa845-bd09-4928-b764-7687d655f618",
          "name": "New6",
          "arm": 67,
          "seatCount": 4,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "86bf1079-f48b-4c80-80ef-ad0de5feb9c6",
          "name": "New7",
          "arm": 89,
          "seatCount": 4,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "afd216f7-a9a6-4181-a402-5853c905a38a",
          "name": "New8",
          "arm": 43,
          "seatCount": 4,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "e29de0cc-9599-4cf8-865c-95db3acfe812",
          "name": "New9",
          "arm": 63,
          "seatCount": 4,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "33407075-a958-4458-9aed-1afe10e25641",
          "name": "New0",
          "arm": 76,
          "seatCount": 4,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "9bb1884c-2fe7-4adf-a386-3f5c6995a936",
          "name": "New-",
          "arm": 24,
          "seatCount": 4,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "d7792403-8e81-4623-8c0d-5a735a6671e0",
          "name": "New",
          "arm": 25,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "cd1c6c43-c516-4c16-9c5b-7f523297285b",
          "name": "New",
          "arm": 63,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "a7333113-bb9d-4e32-b6b2-47e537cfbe36",
          "name": "New",
          "arm": 27,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "66b43b4d-68bb-4309-87c0-867c4801f4a6",
          "name": "New",
          "arm": 17,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "94f23547-abab-42b3-9220-a1912e64c2be",
          "name": "New",
          "arm": 95,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "a98e3cf4-6d31-40dc-824e-efb2efb50c00",
          "name": "New",
          "arm": 36,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        },
        {
          "id": "859c9362-20b5-41e3-b7e3-1ac9fa1616dd",
          "name": "New",
          "arm": 52,
          "seatCount": 2,
          "maxWeight": 300,
          "lateralDist": 0
        }
      ],
      "cargoAreas": [
        {
          "arm": 200,
          "id": "1e9faa7c-9e5a-444b-9198-b076b229f71f",
          "name": "C 1",
          "maxWeight": -75
        },
        {
          "arm": 220,
          "id": "82c9ee7c-750f-4ecb-9ff3-68c20b1b20f3",
          "name": "C 2",
          "maxWeight": 25
        },
        {
          "arm": 240,
          "id": "208cfe15-16a1-4a4d-b903-3ddda2d36b05",
          "name": "C 3",
          "maxWeight": 225
        },
        {
          "id": "b74ad7be-f593-47b5-bd13-966d515ded9f",
          "name": "C 4",
          "arm": 260,
          "maxWeight": 300
        },
        {
          "id": "83644e5e-ef62-4b55-a201-209ed2a2b637",
          "name": "C 5",
          "arm": 280,
          "maxWeight": 300
        },
        {
          "id": "9fa585a6-2c99-45d9-862b-3713551519b3",
          "name": "C 6",
          "arm": 300,
          "maxWeight": 300
        }
      ],
      "fuelTanks": [
        {
          "id": "230891cd-8352-4523-be6f-a21fbf1dc327",
          "name": "",
          "arm": 80,
          "maxWeight": 900,
          "unusable": 26,
          "removable": false
        },
        {
          "id": "430891cd-8352-4523-be6f-a21fbf1dc327",
          "name": "Negative",
          "arm": 80,
          "maxWeight": 100,
          "unusable": -26,
          "removable": true
        },
        {
          "id": "7a6bd575-1d02-4473-b033-f2143aca9d98",
          "name": "",
          "arm": 70,
          "maxWeight": 100,
          "unusable": 10,
          "removable": true
        }
      ],
      "limits": {
        "regions": [
          {
            "name": "Normal",
            "id": "10f0e415-8824-4adc-a1ad-eeea9799d8de",
            "color": "#D11F1F",
            "data": [
              {
                "id": "2ffa563b-5106-4756-9471-641c4ed5e7ed",
                "arm": 35,
                "weight": 1500
              },
              {
                "id": "170226ae-483c-4f7e-8fcb-0f2b0a5c8f6b",
                "arm": 35,
                "weight": 1950
              },
              {
                "id": "746507b1-304c-4c32-87b0-3e4f308e0a8d",
                "arm": 41,
                "weight": 2550
              },
              {
                "id": "e59c42d5-7c86-49c7-b5ac-a4c58e1cf393",
                "arm": 47.5,
                "weight": 2550
              },
              {
                "id": "28a5ee98-a77f-45dd-a229-e5684066cc4d",
                "arm": 47.5,
                "weight": 1500
              }
            ]
          },
          {
            "name": "Utility",
            "id": "e732f25b-0ec8-4217-b428-b0591bf2f381",
            "color": "#4294FF",
            "data": [
              {
                "id": "b42d2c64-6f14-40a8-9f1e-920c7106212d",
                "arm": 35,
                "weight": 1500
              },
              {
                "id": "98ae1858-9e8c-4326-954a-a242580964a2",
                "arm": 35,
                "weight": 1950
              },
              {
                "id": "3a28a9a2-7f75-439b-8ce1-5db2edb35163",
                "arm": 37.5,
                "weight": 2200
              },
              {
                "id": "e412261a-c21e-4468-86d6-3e3226206418",
                "arm": 40.5,
                "weight": 2200
              },
              {
                "id": "d2995af3-17f5-42e9-bb29-8ae6028bf8a0",
                "arm": 40.5,
                "weight": 1500
              }
            ]
          }
        ],
        "limits": []
      },
      "equipment": [
        {
          "id": "d2f90aa7-4814-491c-bfa9-fb23b2facc24",
          "name": "Test1",
          "weight": 10,
          "arm": 20,
          "area": ""
        },
        {
          "id": "c2f90aa7-4814-491c-bfa9-fb23b2facc24",
          "name": "Test2",
          "weight": -10,
          "arm": 20,
          "area": ""
        }
      ],
      "aircraftConfigs": [
        {
          "id": "b53ff2c1-cd0d-44a8-91fe-d73bb19d8f7e",
          "name": "Standard",
          "seats": [
            "30169e82-1cf8-429f-a3ec-0dc9f7519485",
            "6a72e513-a2b6-446d-8605-7b893637e777",
            "39706b2b-00b7-49e8-aeac-7bfbc90be244",
            "c2665776-0600-4cbd-a8dd-c9d4f452e6b8",
            "808510fb-d27a-4a9c-8ba4-b5c7bc79fb78",
            "7f4b606a-766e-4f24-af62-cc950b76c9d1",
            "0c9fa845-bd09-4928-b764-7687d655f618",
            "cd1c6c43-c516-4c16-9c5b-7f523297285b",
            "e29de0cc-9599-4cf8-865c-95db3acfe812",
            "859c9362-20b5-41e3-b7e3-1ac9fa1616dd",
            "1b9357be-c99b-446c-a07b-a2f4e89c73df",
            "afd216f7-a9a6-4181-a402-5853c905a38a",
            "a98e3cf4-6d31-40dc-824e-efb2efb50c00",
            "a7333113-bb9d-4e32-b6b2-47e537cfbe36",
            "d7792403-8e81-4623-8c0d-5a735a6671e0",
            "9bb1884c-2fe7-4adf-a386-3f5c6995a936",
            "66b43b4d-68bb-4309-87c0-867c4801f4a6",
            "33407075-a958-4458-9aed-1afe10e25641",
            "86bf1079-f48b-4c80-80ef-ad0de5feb9c6",
            "94f23547-abab-42b3-9220-a1912e64c2be"
          ],
          "cargoAreas": [
            "1e9faa7c-9e5a-444b-9198-b076b229f71f",
            "208cfe15-16a1-4a4d-b903-3ddda2d36b05",
            "82c9ee7c-750f-4ecb-9ff3-68c20b1b20f3",
            "b74ad7be-f593-47b5-bd13-966d515ded9f",
            "83644e5e-ef62-4b55-a201-209ed2a2b637",
            "9fa585a6-2c99-45d9-862b-3713551519b3"
          ],
          "equipment": [
            {
              "id": "d2f90aa7-4814-491c-bfa9-fb23b2facc24",
              "count": 10
            },
            {
              "id": "c2f90aa7-4814-491c-bfa9-fb23b2facc24",
              "count": 1
            }
          ],
          "fuelTanks": [
            "430891cd-8352-4523-be6f-a21fbf1dc327"
          ]
        },
        {
          "id": "eef20731-07ad-41f8-b5b5-42ba78d50e4f",
          "name": "Extra",
          "seats": [
            "66b43b4d-68bb-4309-87c0-867c4801f4a6",
            "9bb1884c-2fe7-4adf-a386-3f5c6995a936",
            "a7333113-bb9d-4e32-b6b2-47e537cfbe36",
            "30169e82-1cf8-429f-a3ec-0dc9f7519485",
            "a98e3cf4-6d31-40dc-824e-efb2efb50c00",
            "d7792403-8e81-4623-8c0d-5a735a6671e0",
            "cd1c6c43-c516-4c16-9c5b-7f523297285b",
            "e29de0cc-9599-4cf8-865c-95db3acfe812",
            "1b9357be-c99b-446c-a07b-a2f4e89c73df",
            "859c9362-20b5-41e3-b7e3-1ac9fa1616dd",
            "7f4b606a-766e-4f24-af62-cc950b76c9d1",
            "808510fb-d27a-4a9c-8ba4-b5c7bc79fb78",
            "39706b2b-00b7-49e8-aeac-7bfbc90be244",
            "c2665776-0600-4cbd-a8dd-c9d4f452e6b8"
          ],
          "cargoAreas": [
            "9fa585a6-2c99-45d9-862b-3713551519b3",
            "83644e5e-ef62-4b55-a201-209ed2a2b637"
          ],
          "equipment": [
            {
              "id": "d2f90aa7-4814-491c-bfa9-fb23b2facc24",
              "count": 1
            }
          ],
          "fuelTanks": [
            "7a6bd575-1d02-4473-b033-f2143aca9d98"
          ]
        }
      ],
      "operationConfigs": [
        {
          "id": "fb76303b-b36a-4ba9-ac27-160151521888",
          "config": "b53ff2c1-cd0d-44a8-91fe-d73bb19d8f7e",
          "name": "Standard",
          "seats": [
            {
              "id": "30169e82-1cf8-429f-a3ec-0dc9f7519485",
              "weight": 200
            },
            {
              "id": "d7792403-8e81-4623-8c0d-5a735a6671e0",
              "weight": 600
            },
            {
              "id": "33407075-a958-4458-9aed-1afe10e25641",
              "weight": 118
            },
            {
              "id": "cd1c6c43-c516-4c16-9c5b-7f523297285b",
              "weight": 600
            }
          ],
          "cargoAreas": [
            {
              "id": "1e9faa7c-9e5a-444b-9198-b076b229f71f",
              "weight": 26
            }
          ]
        },
        {
          "id": "a8e1c3ee-44bc-4682-bad2-57036c8e9265",
          "name": "Extra",
          "config": "eef20731-07ad-41f8-b5b5-42ba78d50e4f",
          "seats": [
            {
              "id": "66b43b4d-68bb-4309-87c0-867c4801f4a6",
              "weight": 200
            },
            {
              "id": "c2665776-0600-4cbd-a8dd-c9d4f452e6b8",
              "weight": 200
            }
          ],
          "cargoAreas": [
            {
              "id": "83644e5e-ef62-4b55-a201-209ed2a2b637",
              "weight": 100
            }
          ]
        }
      ]
    }
  ],
  "setup": {
    "weightUnits": "lbs",
    "lengthUnits": "in",
    "fuelUnits": "gal",
    "useMAC": true,
    "fuelDensity": 6
  }
}`;

export default testingConfig;
