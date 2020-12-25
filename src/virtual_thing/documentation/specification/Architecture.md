# Architecture

In [Virtual Thing Description][vtd] (VTD), behavior of a [Thing] is described in a similar way as writing a script. The core components tha make up a VTD are [DataMaps](#datamap) and [Processes](#Processes). The Processes can be seen as procedures of a script, whereas the DataMaps are structures that store variables that can be accessed by those procedures. Processes are composed of [Instructions](#instructions), each of which describes a certain operation that the [Engine] should perform while simulating a device's behavior. As such, Instructions correspond to statements in a script.

The root object in a VTD is a [VirtualThingModel]. It contains the entire content of the respective [Thing Description][td], but the properties, which are relevant for simulation behavior, are the maps: `Properties`, `Actions` and `Events`. In addition to those maps, a VirtualThingModel can among other properties contain maps of [Sensors and Actuators](#Sensors-and-Actuators). Each entry from the 5 mentioned maps as well as the VirtualThingModel self is a so called [Component with Behavior][behavior], i.e. a component that can contain Processes and a DataMap. Finally, a VirtualThingModel can have DataSchemas - a map of reusable schemas that can be shared among entries of DataMaps as well as other components of the Thing Description that extend the type [DataSchema].

## Processes
Entities that are executable by the [Engine] as a sequence of [instructions](#instructions). Like [DataMap](#datamap), Processes can also be defined in various places within a [Virtual Thing Description][vtd], and their behavior generally does not depend on location, with one exception: if a [Process] is placed within an interaction affordance instance ([Property], [Action] or [Event]), then it may be hooked to certain interaction events and invoked when those events are fired. However, there are alternative ways to invoke a process, whether on an interaction event, explicitly, or periodcally - using [Triggers][Trigger]. Hence, generally, where you place a process is the matter of structuring, readability and maintainability of the [Virtual Thing Description][vtd].  
More on this in [Process], [Property], [Action] and [Event].


## Instructions
One of the aims of the [Virtual Thing Description][vtd] is to provide a behavior description syntax (VTD schema/syntax), which is compact and expressive, but yet powerful enough to be able to describe diverse functionality that a simulated device might offer. In Virtual Thing, each instruction that the [Engine] can interpet and execute has a respective json schema to describe it in a VTD. Since the domain of all possible distinct operations that make up behavior of an arbitrary device can be very large, for each such operation, defining a dedicated instruction in the VTD schema (respectively, implementing in the [Engine]) may be overwhelming. As such, to reach a compromise between compactness and the ability to describe custom behavior, the VTD syntax offers the following two main types of instructions:
- `Special` - with compact description, are able to execute a complex operation, e.g. invoke an [ActionAffordance] of a [ConsumedThing] passing an input payload, and store the returned result.
- `General` - some basic control flow and assignment statements borrowed from programming languages, e.g. "if-else", "loop", "try-catch", "switch", etc. Such instructions, when used extensively, may lead to a bulky VTD. However, they allow to describe a custom complex behavior when needed.  
More on this in [Instruction].


## DataMap
A map of variables/constants that can be used by [Processes](#processes). There are various places within a [Virtual Thing Description][vtd] where DataMap instances can be defined. [Processes](#processes) can access any DataMap defined anywhere within a [Virtual Thing Description][vtd], i.e. all DataMap instances are "global". The decision where to place variables/constants for a particular process is the matter of structuring, readability and maintainability of [Virtual Thing Descriptions][vtd]. In some cases, though, you might want to place variables/constants accessed by a certain process within the process. An example of such a case would be designing a reusable process that can be copy-pasted into different [Virtual Thing Descriptions][vtd] and work right-away without or with minimum modifications.

## Sensors and Actuators
Components that describe hardware behavior. Currently, there is no functionality implemented that could be applied specially to sensors and actuators. All the simulation behavior of a Virtual Thing is based on [Processes](#processes) and [DataMaps](#datamap). As such, a [Sensor] or an [Actuator] instance within a [Virtual Thing Description][vtd] is nothing but yet another place where [Processes](#processes) and/or a [DataMap](#datamap) can be placed. Nevertheless, `Sensors` and `Actuators` can be used for semantical categorization of components, and hence, better structuring in a [Virtual Thing Description][vtd].


[Engine]: Definitions.md#Virtual-Thing-Engine-and-Engine
[vtd]: Definitions.md#Virtual-Thing-Description
[behavior]: Definitions.md#Component-With-Behavior-and-Behavior

[Process]: main_components/Process.md
[VirtualThingModel]: main_components/VirtualThingModel.md
[Property]: main_components/Property.md
[Action]: main_components/Action.md
[Event]: main_components/Event.md
[Sensor]: main_components/Sensor.md
[Actuator]: main_components/Actuator.md

[Instruction]: instructions/Instruction.md

[Trigger]: helper_components/Trigger.md

[Thing]: https://www.w3.org/TR/wot-thing-description/#thing
[td]: https://www.w3.org/TR/wot-thing-description

[ConsumedThing]: https://www.w3.org/TR/wot-scripting-api/#the-consumedthing-interface

[DataSchema]: https://www.w3.org/TR/wot-thing-description/#dataschema

[ActionAffordance]: https://www.w3.org/TR/wot-thing-description/#actionaffordance