# IfElse
Is a type of [Instruction] that is an analog of the `if-else` block in programming languages.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|if|The "if" block.|yes|[If](#if)||
|elif|The "else if" blocks sequence.||Array of [If](#if)||
|else|The "else" block.||Array of [Instruction], at least 1 item||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
Behavior is identical to that of a typical "if-else" that has:
- one "if"
- any number of "else if"
- at most one "else"

# If

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|condition|The "if" condition. The evaluated value will be interpreted as a boolean.|yes|[Math]||
|instructions|Instructions to execute in case the condition is met.||Array of [Instruction], at least 1 item||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

## Behavior
If the `condition` is met:
1. If the `instructions` are specified, they will be executed.
2. The parent [IfElse](#IfElse) will exit.


[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md

[Math]: ../helper_components/Math.md