# CompoundData
Is a [ValueSource] type that returns a value of almost any desired structure composed of `hard-coded` and/or `dynamic` values.

## Schema:
Type: `any`

## Behavior

1. The value of the `CompoundData` is `stringified`.
2. When the value of the `CompoundData` is accessed:
    1. In the `stringified` value:
        1. Substrings of the form `"${<[readOp:]path>}"` (dynamic parameters) are resolved exactly as explained in [ParameterizedString].
        2. Any substring of the form: `"{"copy": <[readOp:]path>}"` is treated as another form of a dynamic parameter and resolved using exactly the same algorithm as the dynamic parameters of a [ParameterizedString].
        
        The difference between the two types of dynamic parameters is that the first is used if the resolved value eventually should be a json serialization (i.e. a string), whereas the second one is used when the resolved value should eventually become a json value. For clarity, please refer to the [examples](#examples).
    2. The resulting resolved string is parsed and returned as a JSON value.

> NOTE: The resolution method of `CompoundData` implies, that while defining a CompoundData instance, you cannot use constructs that match one of the above mentioned `dynamic parameter formats` as actual values, i.e. they will be resolved.

## Examples

For the following examples, assume that there is an array in one of [DataHolder] instances in a [Virtual Thing Description][vtd] instance. The array is `[1, 2, 3]` and can be accessed via a [Pointer] using a path `"./dmap/array"`.

The following examples show a value of a `CompoundData` in a [Virtual Thing Description][vtd] and the value to which it will be resolved:
    
- Hard-coded value example:

    ```JSON    
    [true, 123, "some string"]
    ```

    will be resolved to:

    ```JSON
    [true, 123, "some string"]
    ```

- Dynamic value using a [Pointer]:

    ```JSON
    {"copy": "./dmap/array"}
    ```

    will be resolved to:

    ```JSON
    [1, 2, 3]    
    ```
    
- Dynamic value using a [ReadOperation] with a [Pointer]:

    ```JSON
    {"copy": "length:./dmap/array"}
    ```

    will be resolved to:

    ```JSON
    3
    ```

- [ParameterizedString] :

    ```JSON    
    "Number of items in ${./dmap/array} is ${length:./dmap/array}"
    ```

    will be resolved to:

    ```JSON
    "Number of items in [1, 2, 3] is 3"
    ```
    > NOTE: Unlike [ParameterizedStrings][ParameterizedString] used in other components of a [Virtual Thing Description][vtd], those used in `CompoundData` cannot be of type `array`. In other words, a [ParameterizedString] must be defined as a whole and not split into an array even if it is too long. If you pass a [ParameterizedString] in an array form, it will be treated as an array of different [ParameterizedStrings][ParameterizedString].

- A structure composed of all the previous examples:
    ```JSON
    {        
        "constStr": "some string",        
        "arr": { "copy": "./dmap/array" },        
        "lenOfArr": { "copy": "length:./dmap/array" },
        "paramStr": "Number of items in ${./dmap/array} is ${length:./dmap/array}"
    }    
    ```

    will be resolved to:

    ```JSON
    {
        "constStr": "some string",        
        "arr": [1, 2, 3],        
        "lenOfArr": 3,        
        "paramStr": "Number of items in [1, 2, 3] is 3"
    }    
    ```
- Another one:
    ```JSON
    [
        "some string",        
        { "copy": "./dmap/array" },        
        { "copy": "length:./dmap/array" },
        "Number of items in ${./dmap/array} is ${length:./dmap/array}"
    ] 
    ```

    will be resolved to:

    ```JSON
    [
        "some string",        
        [1, 2, 3],        
        3,        
        "Number of items in [1, 2, 3] is 3"
    ]    
    ```

Below is a [Virtual Thing Description][vtd] that can be used to test the examples above. It logs the value to which the `CompoundData` will be resolved. Replace `<VALUE>` with a `CompoundData` value.

```JSON
{
    "title": "TestCompoundDataThing",
    "processes": {
        "proc":{
            "triggers": [{"runtimeEvent": "startup"}],
            "dataMap": {
                "result": {},
                "array": { "const": [1,2,3] }
            },
            "instructions": [
                {
                    "move": {
                        "from": {
                            "compound": <VALUE> 
                        },
                        "to": { "pointer": "./dmap/result" }
                    }
                },
                {"log": "$p4{./dmap/result}"}
            ]
        }
    }
}
```


[DataHolder]: ../main_components/DataHolder.md
[ReadOperation]: Enums.md#ReadOperation
[Pointer]: Pointer.md
[ParameterizedString]: ParameterizedString.md
[paramStrParamResol]: ParameterizedString.md#Parameter-resolution
[paramStrReadOp]: ParameterizedString.md#Read-operation
[ValueSource]: ValueSource.md
[vtd]: ../Definitions.md#Virtual-Thing-Description