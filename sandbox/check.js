#!/usr/bin/env node

var logger=require('winston');

var WattMeter=require('../yoctowatt.js');

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console,{
	level: "debug",
	colorize: true,
	timestamp: true
});

var w=new WattMeter("any");

w.setSamplingFrequency(1);

w.on("connect",function() { logger.info("CONNECT"); });
w.on("disconnect",function() { logger.info("DISCONNECT"); });
w.on("sample",function(s) { logger.info("sample",s); });
	
setInterval(function(){},1000);
