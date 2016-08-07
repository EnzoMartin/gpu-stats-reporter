GPU Stats Report
=======================

Polls GPU information and reports it to Datadog

Currently only support nVidia hardware


##Install

* Download and install the latest [NodeJS][nodejs]
* Install [DataDog]
* Clone the repo
* Follow the [Node Gyp setup guide]
* Ensure nVidia `NVSMI`, usually located under `C:\Program Files\NVIDIA Corporation\NVSMI`, is in your `PATH`
* Run `npm install` from the repo base directory
* Follow the `Usage` instructions below to configure the options
* Run `node app.js`

##Usage

###Config
| Name | Default | Description |
| ------------- | ------------- |  ------------- |

Copy the example [config] file in `/config/example.local.js` to `/config/local.js` and edit the settings you wish to override

##License
See [license] file

[config]:config/example.local.js
[DataDog]:https://www.datadoghq.com/
[license]:license
[Node Gyp setup guide]:https://github.com/TooTallNate/node-gyp#installation
