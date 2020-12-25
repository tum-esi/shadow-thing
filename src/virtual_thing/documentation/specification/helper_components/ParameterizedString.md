# ParameterizedString
A string or array of strings, which can contain dynamic parameter.

## Schema
Type: `string` or Array of `string`


## Behavior

### Parameter resolution
Value of a `ParameterizedString` (a string or an array of strings) will be joined by simple concatenation into a **`single string`**.  

The `single string` ***may*** contain dynamic parameters of the form `${<pointer path>}` where the `<pointer path>` is a [valid Pointer path][ptrpaths]. Parameters may have nested parameters at any nesting level.  

On each read of the value of a `ParameterizedString` by the [Engine], the parameters (if any) will be resolved iteratively in a `bottom-up` manner, i.e. the parameters at the lowest nesting level will be resolved first. Resolving means a parameter will be replaced by a `stringified representation` of the value obtained using the respective [Pointer]. After resolution, a resolved string is returned to the [Engine].

### Parameter formatting

The `stringified representation` mentioned in [Parameter resolution](#Parameter-resolution) can be formatted "prettily":
- `$p{<pointer path>}` - note `p` after `$`  
This will format the `stringified representation` using an indentation level of `2`.
- you can specify a custom indentation by appending a digit `[1-9]` to `p`:  
    `$p4{<pointer path>}` - this will use an indentaion of `4`.

### Read operation
A [parameter's resolution](#Parameter-resolution) implies **`reading`** a value using a [Pointer]. The default [ReadOperation] used in parameter resolution is `"get"`. You can specify another [ReadOperation] using the following parameter format:  

`${<read op>:<pointer path>}`, e.g. `"The array contains: ${length:path/to/array} items."`.  

The effect of each [ReadOperation] is explained in [ValueSource][ValueSourceReadOp]. Here are some remarks regarding their usage in a `ParameterizedString`:
- `"copy"` - does not make sense, since the `stringified representation` mentioned in [Parameter resolution](#Parameter-resolution) already implies a copy of the original value.
- `"parse"` - the value returned by the [Pointer] during the [parameter's resolution](#Parameter-resolution) is stringified anyways, so parsing the value from a string to stringify it again does not make sense froma a first glance. However, you can use this e.g. to re-format an already existing stringified value using [Parameter formatting](#Parameter-formatting), e.g.:  

    `"$p4{parse:path/to/some/stringified/value}"`.
    
An invalid read operation, i.e. an operation incompatible with the pointed data type will cause a [fatal error][fatal].

## Examples

Let's consider a `ParameterizedString`:

```JSON
[
    "This is a long parameterized st",
    "ring ${/path/to/array",
    "/${path/to/index}}."
]
```
1. An instance of `ParameterizedString` created from the above value will have the following value:

    ```JSON
    "This is a long parameterized string ${/path/to/array/${path/to/index}}."
    ```
2. Whenever the value is read by the [Engine], the following will happen:
    1. The deepest parameter `${path/to/index}` will be resolved.  
    Let's assume a [Pointer] with the path `"path/to/index"` in our [Virtual Thing Description][vtd] returns a value `5`. Then the new value of the `ParameterizedString` will become:

        ```JSON
        "This is a long parameterized string ${/path/to/array/5}."
        ```
    2. Again, the deepest parameter, this time `${/path/to/array/5}`, will be resolved let's assume to a value `"example"`. Then the new value will become:

        ```JSON
        "This is a long parameterized string example."
        ```
    3. Since there are no parameters left, the value will be returned.

[ValueSourceReadOp]: ValueSource.md#Read-operations
[ReadOperation]: Enums.md#ReadOperation
[Pointer]: Pointer.md
[ptrpaths]: Pointer.md#valid-paths
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine
[vtd]: ../Definitions.md#Virtual-Thing-Description
[fatal]: ../LogsAndErrors.md#Fatal-Errors