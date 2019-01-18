# Virtual Thing

Creates and deploys a virtual thing based on its TD

## Why use this software
You may want to create a mashup scenario or a test script for a WoT thing that you only have a TD for. This tool allows you to simulate a thing based only on its TD.

## Prerequisites
All systems require:
* [NodeJS](https://nodejs.org/) version 10+ (e.g., 10.13.0 LTS)

### Linux
Meet the [node-gyp](https://github.com/nodejs/node-gyp#installation) requirements:
* Python 2.7 (v3.x.x is not supported)
* make
* A proper C/C++ compiler toolchain, like GCC

### Windows
Install the Windows build tools through a CMD shell as administrator:
```
npm install -g --production windows-build-tools
```

### Mac OS
Meet the [node-gyp](https://github.com/nodejs/node-gyp#installation) requirements:
```
xcode-select --install
```

## How to start a virtual thing
### Install this package
Clone this repository and go into it:
```
git clone https://github.com/tum-ei-esi/virtual-thing
cd virtual-thing
```
Install dependencies and build project:
```
npm install 
npm run build
```

### Optional: create a link
Make the package available on your local machine (as a symlink). You can then use each paket in its local version via `npm link <module>` instead of `npm install <module>` (see also https://docs.npmjs.com/cli/link).
```
npm link
```
This step also allows you to start a virtual-thing by just calling the command `virtual-thing` from anywhere within your computer, instead of having to call `node dist/cli.js` inside this package.

### Start with the default example TD
To get to know how the virtual-thing module works, you can start a virtual thing based on the default example TD provided.
`cd` to the root of this module and run:
```
node dist/cli.js
```
or if you created a link, you can just call
```
virtual-thing
```

### Start a virtual thing based on any TD
you can create a virtual thing based on any given TD:
```
node dist/cli.js path/to/my/example_td.json
```
or if you created a symlink:
```
virtual-thing path/to/my/example_td.json
```

### Provide your own configuration file
By default, the virtual thing will run on the local loopback address `127.0.0.1` and on port `8080`. You can change those defaults by providing your own JSON formatted config file:
```
virtual-thing -c path/to/conf.json path/to/my/example_td.json
```

### Change the configuration
the config file is a JSON file that allows you to configure some aspect of the virtual thing. These include: 
* HTTP Server parameters
* Logging levels
* Event Intervals

The configuration file format looks like this:
```JSON
{
 "servient": {
     "staticAddress": STATIC,
     "http": {
         "port": HPORT,
 },
 "log": {
     "level": LOGLEVEL
 },
 "things": {
     "THING_ID": {
         "eventIntervals": {
             "EVENT_ID1": INTERVAL,
             "EVENT_ID2": INTERVAL
         },
         "twinPropertyCaching": {
             "PROPERTY_ID1": INTERVAL,
             "PROPERTY_ID2": INTERVAL,
         }
     }
 }
}
```

For example, you can set-up the virtual-thing to generated a specific event every 60seconds. 
You can also set the logging level between 0 and 4:  `{ error: 0, warn: 1, info: 2, log: 3, debug: 4 }` 

To get more information about this, as well as other configurable values, you can look into the default config file `virtual-thing.conf.json`.

### More Help:
If you need more help, run:
```
virtual-thing --help
```

## Useful Links:
1. [Thing Description Specification](https://w3c.github.io/wot-thing-description/#thing)
2. [Scripting API Specification](https://w3c.github.io/wot-scripting-api/)
3. [node-wot implementation of the Scripting API](https://github.com/eclipse/thingweb.node-wot)