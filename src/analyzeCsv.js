const csvjson = require('csvjson');
const fs = require('fs');
var grubbs = require('grubbs');
const {std,sum} =require('mathjs')

var options = {
    delimiter: ',', // optional
    quote: '"' // optional
};
var totalTimes = [];
const directoryString = "tests2/v100/#1/";
var directory = fs.readdirSync(directoryString);

for (let index = 0; index < directory.length; index++) {
    //reading file
    var curPath = directory[index];
    var curCsv = fs.readFileSync(directoryString+curPath + "/prop_intensity.csv").toString();
    var curJson = csvjson.toColumnArray(curCsv, options);
    var curTimes = curJson['Interval in ms'];

    // members of the array come as strings so converting them to number
    for (var i = 0; i < curTimes.length; i++) {
        curTimes[i] = Number(curTimes[i])
    }
    console.log(curTimes)
    //doing cleaning has to be done here since grubs have 100 value limitation
    var result = grubbs.test(curTimes);
    // console.log(result)
    // console.log(result[0])
    // console.log(result[0].dataSet)
    // console.log(result[0].average)
    // var cleaned = result[1];
    // console.log(cleaned)
    // process.exit(0)
    var cleaned = {}
    // if (result[2]==undefined) {
        // if (result[1] == undefined) {
        //     console.log("0 levels")
        //     cleaned = result[0];
        // }
        // else {
        //     cleaned = result[1];
        //      // console.log(result[1])
        //     console.log("1 level")
        // }
    // } else {
    //     cleaned = result[2];
    //     console.log("2 levels")
    // }
    cleaned = result[0];
    
    console.log(cleaned)
    var dataSet = cleaned.dataSet;
    
    // once the data is cleaned by grubbs, we transfer it to another array to calculate average and stdev

    //first you have to remove the undefineds
    var cleanedDataSet = [];
    for (let index3 = 0; index3 < dataSet.length; index3++) {
        if (dataSet[index3]) {
            cleanedDataSet.push(dataSet[index3])
        }
    }
    //then push to total times
    for (let index2 = 0; index2 < cleanedDataSet.length; index2++) {
        totalTimes.push(cleanedDataSet[index2]);
    }
}
console.log(totalTimes)

// var myCsv = fs.readFileSync("tests/real/r1/#1/instance_1/prop_intensity.csv").toString(); 
// var manualJSON = csvjson.toColumnArray(myCsv, options);
// var times = manualJSON['Interval in ms'];
// console.log(times)



// var result = grubbs.test(totalTimes);
// var cleaned = result[2];
// var dataSet = cleaned.dataSet;
// var cleanedDataSet =[];
// for (let index = 0; index < dataSet.length; index++) {
//     if(dataSet[index]){
//         cleanedDataSet.push(dataSet[index])
//     }
    
// }
// var average = cleaned.average;
// var stdev = cleaned.stdev;
// console.log(dataSet);
var stdev = std(totalTimes)
var average = sum(totalTimes)/totalTimes.length
console.log(average);
console.log(stdev);
// console.log(cleanedDataSet);

