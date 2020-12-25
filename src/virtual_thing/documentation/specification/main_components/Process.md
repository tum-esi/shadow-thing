# Process
A component that can be `executed` by the [Engine] as a sequence of instructions to perform the described behavior.

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|triggers|Triggers define when the process should be invoked.||Array of [Trigger]||
|condition|If specified, the `Process` can be executed only if the condition is met, i.e. the value of the expression can be interpreted as `true`.||[Math]||
|instructions|Instructions that will be executed in a sequence when the process is invoked.|yes|Array of [Instruction], at least 1 item||
|dataMap|See [DataMap].||Map of [DataHolder]||
|wait|Whether the `Process` should "await" execution of the `instructions`.||`boolean`|true|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
A `Process` can be invoked using the following methods:
1. `triggers`
2. [Instruction] of type [invokeProcess]
3. See `Implicitly attached processes` of [Property], [Action] or [Event]

The method `2.` can be used at the same time with either of the methods `1.` and `3.`. The methods `1.` and `3.` are mutually exclusive.

[Instruction]: ../instructions/Instruction.md
[InvokeProcess]: ../instructions/InvokeProcess.md

[Math]: ../helper_components/Math.md
[Trigger]: ../helper_components/Trigger.md

[Property]: Property.md
[Action]: Action.md
[Event]: Event.md
[DataHolder]: DataHolder.md

[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[DataMap]: ../Architecture.md#DataMap