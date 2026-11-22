# Config

[Balance Config](https://www.av-tac.com/config) provides a way to create new configuration files.
These files can be broken up as individual aircraft, multiple aircraft of the same type, or a whole fleet of varying types.
The config file is saved in json format and contains all information for calculating aircraft weight and balance.

## Editing

For most users the actual file will be either generated or retrieved from someone else never actually interacting with the underlying json.
It is still good to know some of the basics on how the config file works when editing in the app.
For a detailed description of the json format check out the [spec](config-spec.md).

### Setup
Each file will have a name and some specified setup settings for the entire file.
The name is fixed but the units can be adjusted by the user after loading, though it may reverted back to the original units.

### Aircraft

Everything else is unique to each aircraft.
Aircraft are named using their tail number and type (\[type\]: \[tail number\]).

> [!Note]
> There is no requirement for unique aircraft names, though it would be difficult to differentiate between them.

Empty weight and empty arm are required to be entered as they are the base of all other calculations.

### Limits

The limits section contains both weight limits and loading regions.
The weight limits define weight limits such as Max Takeoff Weight or Max Landing Weight.
The regions define an envelope that depends on both weight and arm.

Both limits and regions are named and can have a line style added and color.
The weight limit is simply defined by the single weight.
Regions are defined by a series of weight, arm pairs with no limit on the number of points.

### Seats/Cargo Areas

Seats and cargo areas are very similar only differing in 2 places.
Seats are assumed to only hold 1 person of up to the max weight for that seat and seats have the ability to be offset laterally in the plane (this is not used for W&B calculations).
Cargo areas are simply just a specific arm where weight can be loaded up to the max weight.

In the most general sense, passengers are the people (person, clothes, carry-ons) and cargo is anything else that is being transported in the plane.

> [!Note]
> Seats and cargo areas are just the location where something can go, not the actual seat.
> The physical seats should be considered as equipment that can be added/removed depending on config separate from the seat positions described above.

### Fuel

Fuel tanks have slightly more complex function.
The arm and max fuel are similar to cargo areas.
Unusable fuel provides a way to limit how low the fuel can get in the tank (it is always assumed the unusable fuel is in the tank).
Priority affects both loading and unloading (burning) fuel.
For fuel burn it is assumed that all tanks with the same priority burn at the same rate.
Each priority level will be used until empty before the next lower priority starts being used.

When loading fuel the reverse happens.
The lowest priority fills first until full then the next level fills.
All tanks of the same priority fill until all tanks are full before the next higher priority tanks get fuel.

> [!Tip]
> There are two fuel tank groups, one the wing tanks, and the other a removable tank in the back of the plane.
> Let's say that the removable tank is burned first before touching the wing tanks.
> This would mean the wing tank has a lower priority than removable tank (the removable tank would also have removable selected).

Making a tank removable makes it possible to have multiple configs for the same aircraft with different fuel limits.
This should match the physical ability to add/remove the tank from the aircraft (i.e. baldders, rigid tanks in cabin).
The should also be able to feed the engine while in-flight, any other fuel should be considered cargo.

### Equipment

Equipment can be thought of as anything that travels with the aircraft, not included in the empty weight.
Some items may be defined in the POH/AOH and other may just be common things that are carried with the aircraft.
Equipment are considered part of the aircraft configuration, so they can be added/removed depending on how the aircraft is setup (seats, tools).

Just about anything with a weight and arm can be defined as equipment.
Examples of some equipment:

- Extra Oil
- Wheel Pants
- Rear seats
- Straps/carabiners
- Repair toos/extra parts
- Spare Tire
- Tow Bar

When defining equipment, position can defined manually or relative to a predefined position.
Define everything that could possibly be present and then select what is actually there in the configuration setup.

### Configs

Configs can be thought of as the layout of the aircraft.
Everything up to this point was defining what could go on the aircraft and where.
Now, you can start building the plane, first by selecting the available seats and cargo areas, fuel tanks, and all present equipment.

There can be many different configs defined for different setups.
Below are just a few ideas for different configs

- Standard (factory setup with factory equipment)
- Long Range (remove the rear seasts and add a removable fuel tank)
- Cargo (replace the rear seats with a cargo area)

### Ops Configs

The final step, and what is used for the actual weight and balance calculations, ops configs are simply a specific config with predefined crew and cargo unrelated to passengers and transported cargo.
Here you define where the crew will sit and how much cargo they have to create a baseline weight and balance that is then added to with any loaded passengers, cargo, and fuel.

