/* eslint no-process-env: 0 */
'use strict';

const pjson = require('../package.json');
const os = require('os');
const networks = os.networkInterfaces();

// Find the current IP
var ip = '127.0.0.1';
for(var name in networks){
    if(networks.hasOwnProperty(name)){
        var network = networks[name];
        var i = 0;
        var len = network.length;

        while(i < len){
            var adapter = network[i];
            if(adapter.family === 'IPv4' && adapter.internal === false){
                ip = adapter.address;
                break;
            }
            i++;
        }

        if(ip !== '127.0.0.1'){
            break;
        }
    }
}

class Configuration {
    setBaseConfig(config){
        this.version = pjson.version;
        this.name = pjson.name;
        this.ip = ip;
        this.env = config.env;
        this.port = config.port || process.env.PORT || 3000;
        this.isDev = typeof config.isDev === 'boolean' ? config.isDev : true;
        this.isProd = typeof config.isProd === 'boolean' ? config.isProd : false;
    }

    constructor(config){
        this.setBaseConfig(config);
    }
}

module.exports = {
    Configuration
};
