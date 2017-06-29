#!/usr/bin/env node

/* Copyright (c) Silver Spring Networks, Inc.
 *
 * This software may be used, modified and/or distributed under the terms of the MIT license.
 * See LICENSE file in [the project root / location of the file] for full license information.
 *
 */

// SSN Starfish data platform example using TI CC2650 Sensortag (BLE)
// 2017 Silver Spring Networks
//

// 26June2017: David A. Howard dhoward@ssni.com

const fs = require('fs');
const child = require('child_process');

var starfishSdk = require('starfish-sdk');

// Basic command line argument check
//node nodeapp <ClientId> <ClienSecret> <UUID> <noOfObs>
var noOfObs=parseInt(process.argv[5]);
if((process.argv.length != 6) || (noOfObs<=0) || (isNaN(noOfObs))) {
// UUID may not be correct name for this 6 byte/48 bit 'MAC' address
   console.log('Usage : ' + process.argv[0] + ' ' + process.argv[1] + ' <ClientId> <ClienSecret> <UUID> <NoOfObs>');
   process.exit(-1);
}

// create scratch filenames for child process output
var filename = 'data.txt'
var exceptionFilename = 'exception.txt'

//if we are running as a configned 'snap', must specify read/write directory
if(process.env.SNAP_USER_DATA) {
  var filename = process.env.SNAP_USER_DATA + '/' + filename;
  var exceptionFilename = process.env.SNAP_USER_DATA + '/' + exceptionFilename;
}

console.log('filename: \n' + filename +'\nexceptionFilename:\n' + exceptionFilename);

// Create an object of StarfishService to communicate with the SSN Starfish data platform
const options = {
  'credentials' : {
    'clientId' : process.argv[2],
    'clientSecret' : process.argv[3]
  },
  'solution' : 'sandbox'
};
var starfish = new starfishSdk(options)

// Find/Create a Starfish deviceId
var deviceId = undefined;

//!dh attempt to find a device matching the MAC test device
// use getDevices API, search for "deviceType": "SensorTag" and
// see if "macaddress" == process.argv[4]. if so retrieve the
// deviceId and use it.  Otherwise create a new device

starfish.queryDevices({deviceType:'SensorTag'}, (err, response) => {
  if (err) {
    console.log('Error!! SF getDevices: ' + err);
    process.exit(-1);
  } else {
    var res = response;
      
    var resf = res.filter ( // filter queryDevices result
      (it) => {
        return it.domainInfo.macaddress.toLowerCase() === process.argv[4].toLowerCase(); // check for macaddress match
      }
    );

    if(resf.length != 0) {
      deviceId = resf[0].id; // use first match from Starfish Data platform
      console.log('Device found\nDeviceId= ' + deviceId);
    }
    
    //create/update Starfish Data platform device
    //! call next step setup test device, (post device function if macaddress not defined)
    sfDevice(deviceId);
  }
}); //starfish.getDevices

// check deviceId, create if undefined
function sfDevice(deviceId) {
  if(deviceId == undefined) {
    // Starfish device
    var testDevice = {
      "deviceType": "SensorTag",
      "domainInfo": {
        "modelName": "CC2650",
        "macaddress": process.argv[4],
        "timestamp": new Date().toISOString()
      }
    }
    //post device, obtain device ID
    //if successful try getObs, else error message and exit
    starfish.postDevice(testDevice, (err, response) => {
      if (err) {
        console.log('Error!! SF postDevice: ' + err);
        process.exit(-1);
      } else {
        deviceId = response.id;
        console.log('Device Created Successfully\nDeviceId= ' + deviceId);

        noOfObs=getObs(deviceId);      // start getting observations from sensortag
      }
    }); // starfish.postDevice
  } else {
    noOfObs=getObs(deviceId);          // start getting observations from sensortag 
  }
}

// get Observations from TI Sensortag, post to Starfish deviceId
function getObs(deviceId) {
  //use a child process for obtaining observations from the TI-Sensortag device
  var err = fs.openSync(exceptionFilename, 'w');
  var out = fs.openSync(filename, 'w');

  const st = child.spawnSync('sensortag', ['--all', '-n1', '-t1', process.argv[4]],
    { //options
      stdio: [
        'ignore',  // no input
        out,       // Direct child's stdout to a file
        err        // Direct child's stderr to a file
      ]
    }
  );

  fs.closeSync(out);
  fs.closeSync(err);

  // add timestamp
  var timestamp = new Date().toISOString();
  console.log('\n\nNotify Event TimeStamp ' + timestamp);

  // read results
  var observation = fs.readFileSync(filename, 'utf8');

  console.log('out \n' + observation);

  // parse results from output file text
  observation = observation.slice(observation.search('\n')+1, observation.length); //skip first line
  observation = observation.replace(/\n/g,","); // newline to ,
  observation = observation.replace(/[(a-zA-Z( ):\t]/g,""); // remove all non numeric
  observation = observation.replace(/'',/g,""); // remove empty fields
  var sdata = observation.split(",");

  if(sdata.length == 18) {
    var accelerometer = {"x": parseFloat(sdata[ 6]), "y": parseFloat(sdata[ 7]), "z": parseFloat(sdata[ 8])}; // G
    var magnometer    = {"x": parseFloat(sdata[ 9]), "y": parseFloat(sdata[10]), "z": parseFloat(sdata[11])}; // uT
    var gyroscope     = {"x": parseFloat(sdata[12]), "y": parseFloat(sdata[13]), "z": parseFloat(sdata[14])}; // degrees/S

    var sensor_obs = {
       "observations": [{
          "timestamp": timestamp,
          "temperature": parseFloat(sdata[0]),  // C
          "humidity": parseFloat(sdata[3]),     // %RH
          "barometer": parseFloat(sdata[5]),    // hPa
          "accelerometer": accelerometer,       // G
          "magnetometer": magnometer,           // uT
          "gyroscope": gyroscope,               // degrees/S
          "light": parseFloat(sdata[15]),       // LUX
          "percentlevel": parseFloat(sdata[16]) // %charge
       }]
     };

     //show sensor obs
     console.log('post starfish deviceID sensor_obs\n' + deviceId + '\n' + sensor_obs);

     // post sensortag observation to SSN data platform
     starfish.postDeviceObservation(deviceId, sensor_obs, (err, response) => {
       if (err) {
         console.log("Error!! SF postDeviceObservation: " + err);
      	 process.exit(-1);
       } else {
         console.log("Observation is Posted Successfully for DeviceId: " + deviceId);
         if(noOfObs > 0) {
           noOfObs=getObs(deviceId);
    	 }
       }
     });
   } // if (sdata.length == 18)
   else {
     console.log("Corrupted Sensor Data Length: " + sdata.length);
     console.log("Corrupted Sensor Data:\n" + sdata);
     process.exit(-1);
   }
   return (noOfObs-1);
} //function getObs(deviceId)


