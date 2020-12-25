# Pointer
Pointers are used by various components of a [Virtual Thing Description][vtd] to access other components/values.

## Schema
Type: [ParameterizedString] - a value/expression that should `resolve` to a valid `path`

## Behavior

1. The `path` of a `Pointer` instance may contain `dynamic parameters`, e.g.:  
    - a single string path with dynamic parameters:
        ```JSON
        "path/to/array/${path/to/index}"
        ```
    - ...or an array:
        ```JSON
        [
            "path/to/some/arra",
            "y/that/has/a/veeeeeeeeeeryLo",
            "ngName/${path/to/index}"
        ]
        ```    
    and, hence, is resolved as explained in [ParameterizedString].
2. If the `resolved path` is valid, the entity with that path is accessed and further processed by the component that uses the `Pointer`. If the `resolved path` is invalid, a [fatal error][fatal] occurs.

## Valid paths

A valid `path` of a `Pointer` is a string that:
- is composed of `tokens` separeted by a slash `/`, e.g.:  
    `path/some/obj/arrayProp/5`
- is pointing to an existing [addressable entity](#Addressable-entities) in a [Virtual Thing Description][vtd].

## Addressable entities

### Absolute paths
The paths that start from the root, i.e. [VirtualThingModel].
#### Component map tockens
|Map|Tocken|Adressed entity type|
|-|-|-|
|`processes`| `"proc"` |Map of [Process]|
|`dataMap`| `"dmap"` |Map of [DataHolder]|
|`uriVariables`| `"uv"` |Map of [DataHolder]|
|`properties`| `"p"` |Map of [Property]|
|`actions`| `"a"` |Map of [Action]|
|`events`| `"e"` |Map of [Event]|
|`sensors`| `"sen"` |Map of [Sensor]|
|`actuators`| `"act"` |Map of [Actuator]|

##### Usage
- "`proc`/<process_name>"
- "`p`/<property_name>/`proc`/<process_name>"
- "`p`/<property_name>/`proc`/<process_name>/`dmap`/<dataHolder_name>"
- "`a`/<action_name>/`dmap`/<dataHolder_name>"
- "`e`/<event_name>/`uv`/<uriVar_name>"
- "`sen`/<sensor_name>/`dmap`/<dataHolder_name>"
- "`act`/<actuator_name>/`proc`/<process_name>"

#### [Property]-specific tockens
|Component|Tocken|Adressed entity type|
|-|-|-|
|`property-buffer`| `"i"` or `"o"` |[DataHolder]|

##### Usage
- "p/<property_name>/`i`" or "p/<property_name>/`o`" (both point to the same entity)

#### [Action]-specific tockens
|Component|Tocken|Adressed entity type|
|-|-|-|
|`input-buffer`| `"i"` |[DataHolder]|
|`output-buffer`| `"o"` |[DataHolder]|

##### Usage
- "a/<action_name>/`i`"
- "a/<action_name>/`o`"

#### [Event]-specific tockens
|Component|Tocken|Adressed entity type|
|-|-|-|
|`data-buffer`| `"d"` |[DataHolder]|
|`subscription-buffer`| `"s"` |[DataHolder]|
|`cancellation-buffer`| `"c"` |[DataHolder]|

##### Usage
- "e/<event_name>/`d`"
- "e/<event_name>/`s`"
- "e/<event_name>/`c`"

#### [DataHolder]-specific tockens
When tockens reach a [DataHolder], the subsequent tockens are treated as a relative path within the [DataHolder].
The relative paths within a [DataHolder] are handled using [json-pointer].
##### Usage
- ".../dmap/<dataHolder_name>" - no relative path (root), i.e. the entire value of the [DataHolder]
- ".../dmap/<dataHolder_name>`/path/to/some/object/<prop_name>`"
- ".../dmap/<dataHolder_name>`/path/to/some/array`"
- ".../dmap/<dataHolder_name>`/path/to/some/array/<index>`"
- etc.


### Relative paths
|Component|Tocken|Adressed entity type|
|-|-|-|
|The [Process] in whose scope the pointer is.| `"."` |[Process]|
|The [Behavior] in whose scope the pointer is.| `".."` |[Behavior]|

##### Usage
- "`.`"
- "`..`"
- "`.`/dmap/<dataHolder_name>"
- "`..`/dmap/<dataHolder_name>"
- "`..`/proc/<process_name>"
- "`..`/proc/<process_name>/dmap/<dataHolder_name>/..."

##### Benefits
- shorter paths when referring to the parent [Process] or the parent [Behavior].
- design a reusable component that does not depend on its full path and, hence, can be copy-pasted into different [Virtual Thing Descriptions][vtd] with little or no modifications. For example, a [Process] whose [Instructions][Instruction] and [Triggers][Trigger] access only the `dataMap` of the [Process] self could use a `"./dmap"` instead of `"<absolute_path_to_the_process>/dmap"` and thus, become portable.

### [DateTime] values
Any valid expression described in [DateTime] is a valid pointer path. 
 
##### Usage
- `"dt/local(dd.MM.yy)"`
- `"dt/unix"`
- etc.

### Single-tocken values

|Value|Tocken|Adressed entity type|
|-|-|-|
|The path of the `Pointer instance` self, i.e. where the Pointer is located within the [VirtualThingModel].| `"path"` |`string`|
|The path of the [Process] in whose scope the pointer is.| `"processPath"` |`string`|
|The path of the [Behavior] in whose scope the pointer is.| `"behaviorPath"` |`string`|
|The path of the [VirtualThingModel] (the ExposedThing's title).| `"modelPath"` |`string`|
|The error message (if any) of the [TryCatch] instruction in whose scope the pointer is.| `"err"` |`string`|

[json-pointer]: https://www.npmjs.com/package/json-pointer

[VirtualThingModel]: ../main_components/VirtualThingModel.md
[Process]: ../main_components/Process.md
[DataHolder]: ../main_components/DataHolder.md
[Property]: ../main_components/Property.md
[Action]: ../main_components/Action.md
[Event]: ../main_components/Event.md
[Sensor]: ../main_components/Sensor.md
[Actuator]: ../main_components/Actuator.md
[fatal]: ../LogsAndErrors.md#Fatal-Errors
[vtd]: ../Definitions.md#Virtual-Thing-Description
[ParameterizedString]: ParameterizedString.md

[Instruction]: ../instructions/Instruction.md
[TryCatch]: ../instructions/TryCatch.md

[DateTime]: DateTime.md
[Trigger]: Trigger.md

[Behavior]: ../Definitions.md#Component-With-Behavior-and-Behavior