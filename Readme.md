# Flickerer

Simple WebApp for visual encoding.

It will be used in the seminar ["Security for the Internet of Things"](http://hpi.de/studium/lehrveranstaltungen/it-systems-engineering/lehrveranstaltung/course/2015/identity_management.html) in order to transmit some data to a [TelosB mote](http://www.advanticsys.com/shop/mtmcm5000msp-p-14.html) via it's light sensor.

The contiki app for decoding is in development [here](https://github.com/Lixissimus/Security4Things).

## Setup

The following instructions are for a linux-based environment, please refer to the docs for Windows or Mac.

You need Java.

Install nodejs and npm

```
sudo apt-get install nodejs npm
sudo ln -s /usr/bin/nodejs /usr/bin/node
```

Install phonegap and cordova as npm modules

```
sudo npm install -g phonegap cordova
```

Install (extract) the android-sdk from http://developer.android.com/sdk/index.html#Other (SDK Tools only).
Go into the tools folder and execute

```
./android sdk
```

Select the newest Android SDK Platform-tools, Build-tools and the android version you want to develop for - Install.

Add the tools and platform-tools directory to your path, e.g. put this into your .bashrc

```
export PATH=${PATH}:<my_directory>/platform-tools:<my_directory>/tools
```

## Build instructions

Switch into the phonegap folder (flickerer).

To build the app execute

```
cordova build android
```

To install the app on your phone, connect it to your machine and run

```
cordova run android
```
