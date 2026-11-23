# Templates

Templates are used to create documents that can be printed or saved. They are
written as an html document using [Handlebars](https://handlebarsjs.com/guide/)
to insert information about the aircraft configuration, loading, and diagrams.

Templates are expected to have `.hbs` as the file extension.

## Layout

Templates provide a blank canvas to create any export form desired. It uses standard
html providing great flexibility in terms of layout and styling.

The only additional requirement for a template is an additional header section that must be included somewhere in the document.
This header is used to define properties of the file for a few different uses. Learn more in the [header](#header) section below.

### Header

The header provides extra configuration and properties that belong to the template.
Create the header by writing a multi-line comment at the top of the document.
Inside this comment will be a JSON formatted object.
Possible keys are listed below along with an example.

- name: Name of the template
- description: Description of template
- uses: Basic description of where the template is used
- inputs: List of input fields that are used to add manual entries
- limits: List of the expected limit names that the aircraft should have
- regions: List of the expected region names that the aircraft should have

``` html
<!--
{
  "name": "Basic Template",
  "description": "A simple generic template that provides basic information about the aircraft weight and balance.",
  "uses": "General aviation, C-172, C-182",
  "inputs": [
    {"name": "pilot-name", "label": "Pilot Name", "type": "text"}
  ],
  "limits": ["MTOW", "MRW"],
  "regions": ["Normal", "Utility"],
}
-->
```

#### Info

The name, description, and uses are used to provide more details to users when they are browsing templates.

The name is the only required field. It is used as the display name (file names are not used for anything)

#### Inputs

The inputs section is used to generate the manual inputs. These create a new field
that can be used in the handlebars template.

Inputs are an object with the following possible fields:

- name: field name, used to identify the input in handlebars, must be unique
- label: Display name for the field
- type: type is used to determine the type of input, any valid type for an html input field can be used plus `select`
- default: Defined default value
- options: List of options that are placed into a `select` input type

``` json
"inputs": [
  {"name": "pilot-name", "label": "Pilot Name", "type": "text"},
  {"name": "date", "label": "Date of Flight", "type": "date"},
  {"name": "color", "label": "Background", "type": "color", "default": "#234567"}
  {"name": "flight-type", "label": "Type", "type": "select", "default": "Normal", "options": ["Normal", "Cross Country", "Instrument"]}
]
```

#### Expected Values

Templates have access to read an aircraft's limits and regions by calling for them by name.
The `limits` and `regions` lists are the names of the limits and regions that the template reads.

These do not provide access to the variables but provide an obvious list of variables that are accessed by the template.
The goal is to show what templates are compatible with the used aircraft config.

``` json
"limits": ["MTOW", "MRW"]
"regions": ["Normal", "Utility"]
```

### Handlebars

Using handlebars provides a way for users to rapidly create templates and access variables from the application.
Visit the handlebars website to learn how to use detailed syntax, below is a basic introduction of the syntax.

``` html
<body>
  <h1>Aircraft Weight and Balance</h1>
  <p>{{tailnumber}}</p>
</body>
```

#### Available Variables

The below list are the available variables accessible in the handlebars template.
They are accessed by the tag name.

```
<p>{{aircraftTailNumber}}</p>
<p>{{takeoffWeight}}</p>
```


| tag | type |
| ------------- | -------------- |
| diagram | string |
| mac | number |
| leadingMAC | number |
| aircraftType | string |
| aircraftTailNumber | string |
| aircraftConfig | string |
| emptyWeight | number |
| emptyArm | number |
| configWeight | number |
| configArm | number |
| opsWeight | number |
| opsArm | number |
| takeoffWeight | number |
| takeoffArm | number |
| landingWeight | number |
| landingArm | number |
| zeroFuelWeight | number |
| zeroFuelArm | number |
| numCrew | number |
| crewWeight | number |
| crewArm | number |
| crewCargoWeight | number |
| crewCargoArm | number |
| numPassengers | number |
| passengerWeight | number |
| passengerArm | number |
| cargoWeight | number |
| cargoArm | number |
| equipmentWeight | number |
| equipmentArm | number |
| totalFuel | number |
| totalFuelWeight | number |
| totalFuelArm | number |
| fuelBurn | number |
| fuelBurnWeight | number |
| landingFuel | number |
| landingFuelWeight | number |
| landingFuelArm | number |


#### Units

Current units can be accessed in the units object. The below table contains the defined properties

``` html
<p>{{totalFuel}}{{units.fuelUnits}}</p>
<p>{{takeoffWeight}}{{units.weightUnits}}</p>
```

| tag | type |
| ------------- | -------------- |
| weightUnits | string |
| lengthUnits | string |
| fuelUnits | string |
| useMAC | boolean |
| fuelDensity | number |


#### User defined variables

User variables are defined in the inputs section of the header and are accessed
by their `name` property. The variables are a part of `user` record.

``` html
<style> p { color: {{user.color}}; }</style>
<p>{{user.pilot-name}}</p>
```

#### Available Functions

There are functions defined as handlebars handlers to provide access to properties
in the config. There are some functions that provide direct access to dynamic content
of the config and some general functions to provide helpful actions

In handlebars inline functions are used by writing the function name then each argument with followed by a space.

``` html
<p>{{math cargoWeight "+" passengerWeight}}</p>
<p>1000</p>
<p>{{convertFuel 1000 'gal'}}</p>
<p>151.515151</p>
<p>{{min 10 20}}</p>
<p>10</p>
<p>{{round 102.48593 2}}</p>
<p>102.49</p>
```

##### Aircraft Functions

The aircraft functions provide access to properties and calculations based on the
current aircraft state. Something like `getMac` returns the MAC percentage for a given arm.
`getLimit` returns the limit weight that corresponds to the provided limit name.

| tag | parameters | return |
| -------- | --------- | -------- |
| getMac | arm: number | mac: number |
| getSeatPassengers | name: string | count: number |
| getSeatWeight | name: string | weight: number |
| getSeatArm | name: string | arm: number |
| getCargoWeight | name: string | weight: number |
| getCargoArm | name: string | arm: number |
| getLimit | name: string | weight: number |
| withinRegionL | name: string, weight: number, arm: number | inside: boolean |
| convertWeight | weight: number, unit: string) | weight: number |
| convertLength | length: number, unit: string) | length: number |
| convertFuel | fuel: number, unit: fuelUnitsT) | fuel: number |

##### Helper Functions

Helper functions are a collection of useful functions to help with formatting,
basic logic, and simple math operations.

`object` and `let` are two special functions that provide a slightly different use.
`object` has an undefined set of arguments that get returned as a javascript object.
`let` is a block helper that allows for defining a variable to be used in several places.

``` html
<p>{{object title="Hello" fill=red}}</p>
{{#let "minimum" (min takeoffWeight landingWeight)}}
<p>{{minimum}}</p>
{{/let}}
```

| tag | parameters | return |
| -------- | --------- | -------- |
| math | a: number, opr: ("+" | "-" | "*" | "/"), b: number | number |
| min | a: number, b: number | a < b ? a : b: number |
| max | a: number, b: number | a > b ? a : b: number |
| equal | a: number, b: number | a === b: boolean |
| lessThan | a: number, b: number | a < b: boolean |
| greaterThan | a: number, b: number | a > b: boolean |
| lessThanEqual | a: number, b: number) | a <= b: boolean |
| greaterThanEqual | a: number, b: number | a >= b: boolean |
| date | format: string | date: string |
| round | n: number, precision: number | float: number |
| object | properties | object: object |
| let | name: string, value: any, options: any | variable |

##### Graph Function

Displaying the graph comes with some more customization but also some more complexity.
Unlike the diagram which is just passed as an html string, the diagram is kept as
a react object because an options object can be passed to customize what is displayed.

This is how to display the graph with default settings.

``` html
<div>{{graph}}</div>
```

And with setting the options looks like this, using the option function to set the preferences.

``` html
<div>{{graph (object title=false background=false regionNames=false emptyPoint=false aspectRatio=(math 4 "/" 3))}}</div>
```


| label | type | default |
| ----- | ---- | ------- |
| title | boolean | true |
| background | boolean | true |
| regionShading | boolean | true |
| regionNames | boolean | true |
| limitsLabels | boolean | true |
| emptyPoint | boolean | true |
| configPoint | boolean  | true |
| opsPoint | boolean | true |
| landingPoint | boolean | true |
| takeoffPoint | boolean | true |
| maxConfigPoint | boolean | false |
| configRegion | boolean | false |
| aspectRatio | number  | 140 / 90 |

