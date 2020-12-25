import { readFileSync } from "fs";
import { join } from "path";

import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";

import { VirtualThing } from "./index";

let port = 8081;

let paths = [];
if(process.argv.length > 2){
    for(let i = 2; i < process.argv.length; i++){
        paths.push(process.argv[i]);
    }
}else{
    paths.push(join(__dirname, '..', '..', '..', 'src', 'virtual_thing', 'examples', 'test-thing.json'));
}

let servient = new Servient();
Helpers.setStaticAddress('localhost');

servient.addServer(new HttpServer({port: port}));

function create(vtd, tf){
    new VirtualThing(vtd, tf)
        .produce()
        .then(vt => vt.expose())
        .catch(err => console.log(err));        
}

try{    
    servient.start().then(tf => {
        for(let path of paths){
            let content = JSON.parse(readFileSync(path, "utf-8"));
            if(Array.isArray(content)){
                for(let conf of content){
                    let vtd = JSON.parse(readFileSync(conf.vtd, "utf-8"));
                    if(conf.num > 1){
                        for(let i = 1; i <= conf.num; i++){
                            create({...vtd, title: vtd.title + "_" + i, id: vtd.id + ':n-' + i}, tf);
                        }
                    }else{
                        create(vtd, tf);
                    }
                }
            }else{
                create(content, tf);
            }
        }
    });               
}catch(err){
    console.log(err);
}




