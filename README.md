# SensorTagSnap
SSN Starfish Data Platform BLE TI SensorTag snap

# 29June2017 dhoward@ssni.com
# functionality verified using TI CC2650 Sensortag, and npm starfish-sdk
# please excuse the mess - under construction ;)

# main.js, package.json: SSN Starfish Studio SDK wrapper with BLE TI Sensortag connectivity
# snap/snapcraft yaml:  file to package demo application

# Pre-requisites
a) The machine running the snap must have internet connectivity.
b) Latest version (v2.28) of Snapcraft tool must be installed on system.

# Build the snap
1. Make the snap :
```snapcraft```
 
   When the process completes then you can see "starfish-sensortag-app_*.snap" in the current directory. 

# Install the snap
1. Install the snap : 
```sudo snap install starfish-sensortag-app_*.snap --devmode```

2. Attach the bluetooth-control plug :
```sudo snap connect starfish-sensortag-app:bluetooth-control core:bluetooth-control```

After installing the snap you should be able to see the below snap apps in the `/snap/bin directory`

a) `starfish-sensortag-app.run`
b) `starfish-sensortag-app.blescan`
c) `starfish-sensortag-app.sensortag`

# Usage and examples

# press power button on Sensortag first (smaller button along edge)
# green led should be blinking before running any of the snap apps

# search for Sensortag MAC/UUID 
sudo starfish-sensortag-app.blescan | grep -C3 CC2650

#note the MAC/UUID address 

# test the sensor reading app
starfish-sensortag-app.sensortag -t1 -n1 -all <MAC/UUID>

# run the starfish data platform app
# The usage is as follows :
```starfish-sensortag-app.run <ClientId> <ClienSecret> <MAC/UUID> <NoOfObs>```

 The parameters to be passed (in-order) are described below :
 
 1. ClientId : Valid Startfish Studio platform client Id.
 2. ClientSecret : Valid Starfish Studio platform client secret.
 3. MAC/UUID : MAC address of TI-Sensortag obtained from blescan.
 4. NoOfObs : Number of observations to be fetched from the TI-sensortag.

#Additional notes

# from IoTR or Linux using built in BT (if compatible)
sudo starfish-sensortag-app.blescan |grep -C3 'CC2650 SensorTag'

# from mac linux VM with two BT (one built in, one USB) use the hci1 instead of hci0 
sudo starfish-sensortag-app.blescan -i1 |grep -C3 'CC2650 SensorTag'

#result looks like:
    Device (new): 24:71:89:1a:69:02 (public), -40 dBm 
	Flags: <05>
	Incomplete 16b Services: <80aa>
	Complete Local Name: 'CC2650 SensorTag'
	Tx Power: <00>
	0x12: <08002003>
	Manufacturer: <0d00030000>

#either use post or post with nohup below;  use clientid/secret, and mac from above
#starfish-sensortag-app.run <ClientId> <ClientSecret> <UUID> <#samples>

#post
starfish-sensortag-app.run 5fbc1321-69f8-4750-afea-8a6f7795cfba ngmAApeRzyZTmXjGRq3UQRudoyk+nxM1QoGjZ/GBEYD56C69YeOgVA 24:71:89:1a:69:02 10 

#post nohup (allows disconnect)
nohup starfish-sensortag-app.run 5fbc1321-69f8-4750-afea-8a6f7795cfba ngmAApeRzyZTmXjGRq3UQRudoyk+nxM1QoGjZ/GBEYD56C69YeOgVA 24:71:89:1A:69:02 10 &


This snap works with the TI CC2650 multi-standard SensorTag and Starfish SDK. It obtains the following readings from sensors and posts them to Starfish Data Platform: 

- Temp: Ambient and Object temperature (Cs)
- Humidity: Ambient temperature (Cs) and relative humidity (%)
- Barometer: Temperature (Cs) and Air Pressure (hPa)
- Accelerometer: X,Y,Z axis with a default period for the data is one second. (Gs)
- Magnetometer: Strength of a magnetic field in the three axis (uT)
- Gyroscope: Rotational motion (degrees/second)
- Light: Ambient Light (Lux)

    
# Format of obsevations posted to the Starfish Studio

post starfish deviceID sensor_obs
aba9917e-7f9e-418a-ad43-91ee9a6562aa
[object Object]
Post Options:{
  "method": "POST",
  "body": {
    "observations": [
      {
        "timestamp": "2017-06-26T06:28:57.185Z",
        "temperature": 21.84375,
        "humidity": 51.0009765625,
        "barometer": 1005.85,
        "accelerometer": {
          "x": 0.00048828125,
          "y": -0.99609375,
          "z": 0.040771484375
        },
        "magnetometer": {
          "x": 40.18363858363858,
          "y": 0.7496947496947497,
          "z": 4.947985347985348
        },
        "gyroscope": {
          "x": 3.18145751953125,
          "y": -1.02996826171875,
          "z": -1.4495849609375
        },
        "light": 20.85,
        "percentlevel": 83
      }
    ]
  },
