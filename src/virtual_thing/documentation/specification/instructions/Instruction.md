# Instruction

An entity that can be `executed` by the [Engine] to perform some action.

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|delay|Execute the `Instruction` after a delay.||[Delay]||
|wait|Whether execution of the `Instruction` should be "awaited" by the next one.||`boolean`|true|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||
|readProperty|||[ReadProperty]||
|writeProperty|||[WriteProperty]||
|observeProperty|||[ObserveProperty]||
|unobserveProperty|||[UnobserveProperty]||
|invokeAction|||[InvokeAction]||
|subscribeEvent|||[SubscribeEvent]||
|unsubscribeEvent|||[UnsubscribeEvent]||
|emitEvent|||[EmitEvent]||
|invokeProcess|||[InvokeProcess]||
|move|||[Move]||
|ifelse|||[IfElse]||
|switch|||[Switch]||
|loop|||[Loop]||
|trycatch|||[TryCatch]||
|log|||[Log]||
|info|||[Info]||
|warn|||[Warn]||
|debug|||[Debug]||
|error|||[Error]||
|fake|||[Fake]||
|control|||[Control]||

**\*** additional properties are not allowed.

## Behavior
- Each property of an `Instruction` object except `wait`, `delay` and `comment` is an `instruction-type` property, it defines what type of action the `Instruction` object should perform while being executed by the [Engine]. For simplicity, an `Instruction` object allows to specify multiple `instruction-type` properties, however, only one of them will have actual effect. So, please **do not specify more than 1 `instruction-type` property**.  

- If no `instruction-type` property is specified and there is a `delay`, then the `Instruction` becomes a pure delay instruction.



[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Delay]: ../helper_components/Delay.md

[ReadProperty]: ReadProperty.md
[WriteProperty]: WriteProperty.md
[ObserveProperty]: ObserveProperty.md
[UnobserveProperty]: UnobserveProperty.md
[InvokeAction]: InvokeAction.md
[SubscribeEvent]: SubscribeEvent.md
[UnsubscribeEvent]: UnsubscribeEvent.md
[EmitEvent]: EmitEvent.md
[InvokeProcess]: InvokeProcess.md
[Move]: Move.md
[IfElse]: IfElse.md
[Switch]: Switch.md
[Loop]: Loop.md
[TryCatch]: TryCatch.md
[Fake]: Fake.md
[Control]: Control.md
[Log]: Console.md#Log
[Info]: Console.md#Info
[Warn]: Console.md#Warn
[Debug]: Console.md#Debug
[Error]: Console.md#Error