# Further Work

## Reusable components
The script-like nature of behavior description in Virtual Thing Description (VTD) raises demand for reusable components such as [Processes] and [DataMaps][DataMap]. You can think of it as creating libraries, which contain reusable components, which can be injected into a VTD using some sort of reference. Here, we consider a sample use-case for such concept.

Consider a Thing with a [Property] `"temperature"`. The Property has a [Process] called `"signalGenerator"`, which simulates temperature as a sum of sine waves and writes samples to the Property's buffer. The temperature signal is generated according to the parameters defined in the `"dataMap"` of the Process.
```JSON
{
    "title": "Temperature",
    "properties": {
        "temperature": {
            "type": "number",
            "processes": {
                "signalGenerator": {
                    "triggers": [{"interval": "${./dmap/samplingIntervalMs}"}],
                    "dataMap": {                  
                        "samplingIntervalMs": {"const": 1000},
                        "dcOffset": {"const": 20},                
                        "periodsMs": {"const": [ 40000, 30000, 20000, 10000, 5000 ]},
                        "phaseShiftsRad": {"const": [ 0, 1, 2, 3, 4 ]},
                        "amplitudes": {"const": [ 2, 1, 0.5, 0.2, 0.1 ]}
                    },
                    "instructions": [
                        {
                            "move": {
                                "from": {
                                    "math": [
                                        "sum(",
                                            "dotMultiply(",
                                                "${./dmap/amplitudes},",
                                                "sin(",
                                                    "2 * pi",
                                                    " * dotDivide(${dt/unix} % ${./dmap/periodsMs}, ${./dmap/periodsMs})",
                                                    " + ${./dmap/phaseShiftsRad})))",
                                        "+ ${./dmap/dcOffset}"
                                    ]
                                },
                                "to": {"pointer":"../o"}
                            }
                        }
                    ]
                }
            }
        }
    }
}
```
Now, if we want to add similar properties that e.g. simulate humidity and pressure, we need to copy-paste the whole structure and adjust the values in the `"dataMap"` of the Process. This way, the size of the VTD increases and its maintainability drops.

The following example suggests how the Process could be `reused` in this scenario. Lets consider a modified Process that generates the abovementioned signal and is defined in a file called `"SignalGen.json"`:

```JSON
{
    "triggers": [{"runtimeEvent": "startup"}],
    "dataMap": {                  
        "samplingIntervalMs": {"default": 1000},
        "dcOffset": {"default": 20},                
        "periodsMs": {"default": [ 40000, 30000, 20000, 10000, 5000 ]},
        "phaseShiftsRad": {"default": [ 0, 1, 2, 3, 4 ]},
        "amplitudes": {"default": [ 2, 1, 0.5, 0.2, 0.1 ]},
        "params": {
            "const": [
                "samplingIntervalMs",
                "dcOffset",
                "periodsMs",
                "phaseShiftsRad",
                "amplitudes"
            ]
        },
        "i": {"type": "number"}
    },
    "instructions": [
        {
            "comment": "Try-copy from parent Property the overriden parameters.",
            "loop": {
                "iterator": "./dmap/i",
                "condition": "${./dmap/i} < ${length:./dmap/params}",
                "instructions": [
                    {
                        "trycatch": {
                            "try": [
                                {
                                    "move": {
                                        "from": {"pointer": "../dmap/${./dmap/params/${./dmap/i}}"},
                                        "to": {"pointer": "./dmap/${./dmap/params/${./dmap/i}}"}
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "comment": ["Run an infinite loop that will generate samples and ",
                        "write them into the output buffer of the parent entity",
                        "(must be either a Property or an Action)."],
            "loop": {
                "interval": "${./dmap/samplingIntervalMs}",
                "instructions": [
                    {
                        "move": {
                            "from": {
                                "math": [
                                    "sum(",
                                        "dotMultiply(",
                                            "${./dmap/amplitudes},",
                                            "sin(",
                                                "2 * pi",
                                                " * dotDivide(${dt/unix} % ${./dmap/periodsMs}, ${./dmap/periodsMs})",
                                                " + ${./dmap/phaseShiftsRad})))",
                                    "+ ${./dmap/dcOffset}"
                                ]
                            },
                            "to": {"pointer": "../o"}
                        }
                    }
                ]
            }
        }            
    ]
}
```
This particular implementation of the Process has only one assumption: it must be located inside a [Behavior] instance that has a buffer accessible by the tocken `"o"`, i.e. output (see the line with `"pointer": "../o"`). Such instances can be [Properties][Property] and [Actions][Action]. For an explaination, please refer to [Pointer].

Now, the Process could be reused in a VTD using e.g. "$ref":

```JSON
{
    "title": "Environment",
    "properties": {
        "temperature": {
            "type": "number",
            "dataMap": {                  
                "dcOffset": {"const": 20}
            },
            "processes": {
                "signalGen": {
                    "$ref": "path/to/SignalGen.json"
                }
            }
        },
        "pressure": {
            "type": "number",
            "dataMap": {                  
                "dcOffset": {"const": 1000}
            },
            "processes": {
                "signalGen": {
                    "$ref": "path/to/SignalGen.json"
                }
            }
        },
        "humidity": {
            "type": "number",
            "dataMap": {       
                "samplingIntervalMs": {"const": 5000},           
                "dcOffset": {"const": 60}
            },
            "processes": {
                "signalGen": {
                    "$ref": "path/to/SignalGen.json"
                }
            }
        }
    }
}
```
Note that there are now 3 Properties: `"temperature"`, `"pressure"` and `"humidity"`. Each property has a process called `"signalGen"` that refers to a file called `"SignalGen.json"` where the actual Process is defined. Besides, each Property overrides some parameters that are used to generate the respective signals: the `"temperature"` and the `"pressure"` override the `"dcOffset"` whereas the `"humidity"` additionally overrides the `"samplingIntervalMs"`. This way, we instantiate 3 signal generators with different parameters yet keeping the VTD compact and maintainable.

**Remark**: there is no mechanism implemented in Virtual Thing that would resolve "$ref" references. In order to test the concept, simply replace `{ "$ref": "path/to/SignalGen.json" }` by the content of the `SignalGen.json` manually and run a Virtual Thing with the resulting VTD.





[Property]: ./main_components/Property.md
[Action]: ./main_components/Action.md
[Process]: ./main_components/Process.md
[DataHolder]: ./main_components/DataHolder.md

[Pointer]: ./helper_components/Pointer.md

[Behavior]: Definitions.md#Component-With-Behavior-and-Behavior

[DataMap]: Architecture.md#DataMap
[Processes]: Architecture.md#Processes
