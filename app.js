'use strict';

const config = require('./config/config').initialize();
const exec = require('child_process').exec;
const CSV = require('csvtojson').Converter;
const StatsD = require('hot-shots');

const logger = config.logger.child({file:__filename});
const Client = new StatsD({
    prefix: 'gpu.',
    globalTags: []
});

const params = [
    'count',
    'name',
    'pcie.link.width.current',
    'pcie.link.gen.current',
    'display_mode',
    'display_active',
    'driver_version',
    'uuid',
    'fan.speed',
    'pstate',
    'memory.total',
    'memory.used',
    'memory.free',
    'utilization.gpu',
    'temperature.gpu',
    'power.draw',
    'clocks.gr',
    'clocks.sm',
    'clocks.mem',
    'clocks.video'
].join(',');
const query = `nvidia-smi --format=csv --query-gpu=${params}`;

function reportGpuStats(gpu){
    const gpuUsed = parseInt(gpu['memory.used [MiB]'].replace(' MiB',''),10);
    const gpuTotal = parseInt(gpu['memory.total [MiB]'].replace(' MiB',''),10);
    const percentUsed = (gpuUsed / gpuTotal * 100).toFixed(2);

    const tags = [
        `gpus:${gpu.count}`,
        `name:${gpu.name}`,
        `driver:${gpu.driver_version}`,
        `uuid:${gpu.uuid}`
    ];

    if(gpu.display_mode !== ''){
        tags.push(
            `screen_connected:${gpu.display_mode}`,
            `screen_active:${gpu.display_active}`
        );
    }

    Client.gauge('fan', gpu['fan.speed [%]'], tags);
    Client.gauge('pstate', gpu.pstate.replace('P',''), tags);
    Client.gauge('pcie.generation', gpu['pcie.link.gen.current'], tags);
    Client.gauge('pcie.speed', gpu['pcie.link.width.current'], tags);
    Client.gauge('memory.used', gpuUsed, tags);
    Client.gauge('memory.free', gpu['memory.free [MiB]'].replace(' MiB',''), tags);
    Client.gauge('memory.total', gpuTotal, tags);
    Client.gauge('memory.pct', percentUsed, tags);
    Client.gauge('utilization', gpu['utilization.gpu [%]'].replace(' %',''), tags);
    Client.gauge('temperature.celsius', gpu['temperature.gpu'], tags);
    Client.gauge('temperature.fahrenheit', (gpu['temperature.gpu'] * 1.8 + 32).toFixed(0), tags);
    Client.gauge('watts', gpu['power.draw [W]'].replace(' W',''), tags);
    Client.gauge('clock.shader', gpu['clocks.current.graphics [MHz]'].replace(' MHz',''), tags);
    Client.gauge('clock.streaming', gpu['clocks.current.sm [MHz]'].replace(' MHz',''), tags);
    Client.gauge('clock.memory', gpu['clocks.current.memory [MHz]'].replace(' MHz',''), tags);
    Client.gauge('clock.encoder', gpu['clocks.current.video [MHz]'].replace(' MHz',''), tags);
}

function parseData(data,next){
    const Parser = new CSV({
        flatKeys: true
    });

    Parser.fromString(data,(err,result) =>{
        if(err){
            logger.error({err},'Failed to parse CSV output');
            console.log(data);
        } else {
            result.forEach((gpu) =>{
                // Set unsupported returns to an empty string for simplicity
                for(const key in gpu){
                    if(gpu.hasOwnProperty(key)){
                        const value = gpu[key];
                        if(value === '[Not Supported]'){
                            gpu[key] = '';
                        } else {
                            if(value === 'Enabled'){
                                gpu[key] = true;
                            } else if(value === 'Disabled'){
                                gpu[key] = false;
                            }
                        }
                    }
                }

                next(gpu);
            });
        }
    });
}

function queryGpus(){
    exec(query,(err,result) =>{
        if(err){
            logger.error({err}, 'Failed to get stats from GPUs');
        } else {
            parseData(result,reportGpuStats);
        }
    });
}

exec('nvidia-smi',(err) =>{
    if(err){
        throw new Error('nVidia SMI is not available, verify that it is part of your PATH environment variable');
    } else {
        logger.info('nVidia SMI found, beginning loop and reporting');
        setInterval(queryGpus,5000);
        queryGpus();
    }
});
