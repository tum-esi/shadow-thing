# Sensor
An object that describes behavior of a sensor (e.g. a temperature sensor) that needs to be simulated.

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