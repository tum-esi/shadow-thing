# Actuator
An object that describes behavior of an actuator (e.g. a motor, switch, etc.) that needs to be simulated.

## Schema
Type: `object`

| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
| dataMap | See [DataMap]. | | Map of [DataHolder] | |
| processes | See [Processes]. | | Map of [Process] | |

[DataHolder]: DataHolder.md
[Process]: Process.md

[DataMap]: ../Architecture.md#DataMap
[Processes]: ../Architecture.md#Processes