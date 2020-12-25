# Virtual Thing CLI
After building the `Shadow Thing`, you will get a CLI called `vt-cli.js` under `shadow-thing/dist/virtual_thing/src`. The CLI instantiates Virtual Things at http://localhost:8081 from Virtual Thing Descriptions (further as VTD) passed as CL arguments.  


Assuming your current directory is `shadow-thing`:

- You can instantiate a default Virtual Thing using:

    ```
    node dist/virtual_thing/src/vt-cli.js 
    ```
    This command will create a Thing http://localhost:8081/TestThing from the VTD file [test-thing.json][test-thing].

- To run your custom Things, simply pass the paths to their VTD files as arguments:

    ```
    node dist/virtual_thing/src/vt-cli.js src/virtual_thing/examples/temperature-fake.json src/virtual_thing/examples/temperature-simple-sine.json
    ```

- A more convenient way to create multiple Thing instances is to pass a `json configuration` file of the form:

    ```
    [
        {
            "path": <path to a VTD>,
            "num": <number of instances>
        },
        {
            "path": <path to another VTD>,
            "num": <number of instances>
        },
        ...
    ]
    ```
    Example using the [conf.json][conf]:  
    
    ```
    node dist/virtual_thing/src/vt-cli.js src/virtual_thing/examples/conf.json
    ```    

- You can pass any number of conf and VTD files in any order, e.g.:

    ```
    node dist/virtual_thing/src/vt-cli.js conf1.json some-vtd.json conf2.json some-other-vtd.json
    ```


[test-thing]: ../../../src/virtual_thing/examples/test-thing.json
[conf]: ../../../src/virtual_thing/examples/conf.json