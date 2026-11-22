# Balance Config

[Balance Config](https://www.av-tac.com/config) provides a way to create new configuration files.
These files can be broken up as individual aircraft, multiple aircraft of the same type, or a whole fleet of varying types.
The config file is saved in json format and contains all information for calculating aircraft weight and balance.

For more detail on how the config file is designed check out the [description](config.md) or the [spec](config-spec.md)

**Balance Config** is laid out to be used from left to right, building on the previous sections.
It is capable of modifying all parts of the configuration, including copying whole aircraft.

When starting out you can chose to start from scratch or upload a file created by someone else.

> [!Important]
> When using configs created by other users it is still recommended to review the file to
> ensure everything is the way you expect.

## Setup and Aircraft

The first step of a new file is to give it a name, enter the name and select the desired units.

Working on the **Aircraft** tab, it is recommended to build one aircraft at a time.
If there are multiple of the same type, fully build out one aircraft then duplicate it and
modify as needed.

Aircraft names are defined by their tail number and type so those must be filled in for a name to appear.
Enter the empty weight and arm to act as the base for all weight calculations.
The empty config should be as bare as possible, including only what is permanent to the aircraft.
Any removable components will be included as equipment.

Supplying a Leading Edge MAC and MAC will allow for toggling the view in the *units* section of
the **Setup** tab, but this is not required.

If there are multiple aircraft created, it is possible to copy portions of the config from the active aircraft to any others that are selected.
This allows for quick building of a fleet or easy changes to all aircraft.
This will overwrite what was previously in the aircraft so the most common use case will probably be duplicating an entire aircraft or modifying the available equipment in a fleet.

## Limits

Within the **Geometry** tab, the weight restrictions can be entered under *Limits* and the
operation envelopes can be entered under *Regions*.
Both have the ability to change their color and line style as a [dash array](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dasharray).

Add the desired limits and regions for your aircraft and adjust the styling as desired.
Changes should appear on the graph to the right.

## Seats, Cargo and Fuel

Up to this point the basic properties of the aircraft have been defined and the
limitations have been defined. It is time to add the places where passengers and cargo can be loaded.

> [!Note]
> It is important to remember that when adding to this section that you are adding all possible
> locations. Locations may overlap and the diagram on the right may get a little cluttered but
> this will be resolved when the aircraft configurations are defined

Go through the *Seat Config* and *Cargo Config* defining all possible locations. As they are
added the diagram on the right will display the changes.

*Fuel Config* is where fuel tanks are defined.
If there are multiple tanks that are on the same arm and feed the engines evenly they can be
considered one tank.

Setting the priority will determine which tank empties first.
All tanks with the same priority will burn at the same rate.
Higher priority means loaded last and emptied first.

Removable tanks can be added/removed from an aircraft configuration.
These are tanks that can feed the engine in flight but may not always exist in the aircraft. (i.e. long range tanks, fuel bladders)

> [!Note]
> If the fuel can only be used by filling the main tanks from the ground, this should be entered as and equipment item.

### Equipment

Equipment, most generally, defines anything that is a part of the aircraft not included in the empty weight or any equipment that is not considered cargo.
It can span anything from avionics, vents, seats, fire extinguishers, cargo straps and more.

They are defined as an item positioned at a specific arm with a weight per item.
The arm can be specified manually or designated using one of the seat or cargo locations.
Here you are just defining something could exist, setting the count will be defined as part of the aircraft config.

### Aircraft Config

The aircraft configs are where everything up to this point comes together.
You will notice that the diagram has probably gone blank.
This is due to the fact that we are no longer looking all seats and cargo areas but just what is a part of the active aircraft configuration.

Start by naming the config at the top, then start selecting the desired seats, cargo areas, fuel tanks, and equipment that will be a part of that config.
As items are selected the diagram will populate with the selections.
These should match the physical aircraft as much as possible.

Continue to make different aircraft configs for each physical configuration of the aircraft.
For GA, there may only be 1 or 2 different configs but for larger aircraft it may be necessary to make quite a few configs.
It is possible to duplicate configs for easier editing if only small changes need to be made.

### Operation Config

Now that we have defined different ways the aircraft can be setup in, it may be
beneficial to create some operation configurations to reduce repetition when
calculating the weight and balance.
These add crew and crew cargo to the config so they are always accounted for.

> [!Note]
> If you are finding it difficult to understand the purpose of the operation configurations,
> think of them as pre-defined crew compliments. The aircraft may be in the same
> configuration with the same seats but maybe one operation config has just 1 pilot
> and another has 1 pilot and 1 instructor.
>
> Rather than adding each member under the loading tab they are automatically added.
> This also separates the crew from passengers so you can just enter passengers without
> having add crew members and bags to the passenger and cargo counts.

It is possible to modify this when using the config for calculations.

Select the desired aircraft config to use and name the operation config.
You can have multiple operation configs with the same aircraft config for different crew compliments or crew baggage.

> [!Important]
> If you do not plan to load any operation configs, it is still necessary to create an empty
> operation config for each aircraft config. Just leave everything deselected and name them the
> same name as the aircraft config.

