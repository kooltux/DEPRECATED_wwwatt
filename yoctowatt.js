var _=require('underscore');
var util=require('util');
var yapi=require('node-yoctopuce').yapi;
var logger=require('winston');
var events=require('events');

var DEBUG=true;

var WattMeter=module.exports=function(devhint) {
	events.EventEmitter.call(this);

	this.devhint=devhint || null;
	this.samplingFreq=2;

	this._clear();

	yapi.on("deviceArrival",_.bind(this._onDeviceArrival,this));
	yapi.on("deviceRemoval",_.bind(this._onDeviceRemoval,this));
	yapi.on("functionUpdate",_.bind(this._onFunctionUpdate,this));
}
// inherit EventEmitter
util.inherits(WattMeter,events.EventEmitter);

WattMeter.prototype._clear=function() {
	this.device=null;
	this.devid=null;
	this.devfuncs=null;
	if (this.sampler)
		clearInterval(this.sampler);
	this.sampler=null;
	this.currentSample=null;
}

WattMeter.prototype.connected=function() {
	return (this.device !== null);
}

WattMeter.prototype._onDeviceArrival=function(devid) {
	DEBUG && logger.debug("New device inserted: "+devid);

	if (this.device) return; // already bound
	
	// hint can be:
	// - an id (ex: 245)
	// - a serial (ex: YWATTMK1-09CE1)
	// - logical name 

	var hint=this.devhint;
	if (hint == "any") hint=undefined;

	var devinfo=yapi.getDeviceInfo(devid);
	DEBUG && logger.debug("Yoctopuce device available: ",devinfo);

	var found=false;
	if (hint !== undefined) {
		found=
			((devid===hint) ||
			(devinfo.serial===hint) ||
			(devinfo.logicalName===hint));
	}
	else {
		found=(devinfo.productName === 'Yocto-Watt');
	}
		
	if (!found) return;

	DEBUG && logger.debug("Found Wattmeter devid="+devid);

	// store handle and infos
	this.devid=devid;
	this.device=devinfo;
	this.devfuncs={};

	// get Power function
	var desc=yapi.getFunction('Power',this.device.serial+".power");

	// enumerate functions
	yapi.getFunctionsByDevice(devid).forEach(function(fid) {
		var funcinfo=yapi.getFunctionInfo(fid);
		DEBUG && logger.debug("Function "+fid+": ",funcinfo);
		switch (funcinfo.functionId) {
			case 'current1':
				this.devfuncs[fid]="current";
				break;
			case 'voltage1':
				this.devfuncs[fid]="voltage";
				break;
			case 'power':
				this.devfuncs[fid]="power";
				break;
			default:
				break;
		}
	},this);

	this.emit("connect");

	// initialize measures loop
	this._initSampler();
}

WattMeter.prototype._onDeviceRemoval=function(devid) {
	DEBUG && logger.debug("Device removed: "+devid);

	if (this.device && (this.devid==devid)) {
		this._clear();
		this.emit("disconnect");
	}
}

WattMeter.prototype._onFunctionUpdate=function(fid,value) {
	if (this.currentSample && this.devfuncs && (fid in this.devfuncs)) {
		this.currentSample[this.devfuncs[fid]]=parseFloat(value);
		this.currentSample.ts=(+new Date());
	}
}

WattMeter.prototype.setSamplingFrequency=function(freq) {
	if (freq>0)
		this.samplingFreq=freq;
	else
		throw new Error("Invalid sampling frequency");
}

WattMeter.prototype._initSampler=function() {
	if (this.sampler)
		clearInterval(this.sampler);

	if (this.device) {
		this.currentSample={
			tsmin: (+new Date())
		};
		this.sampler=setInterval(_.bind(this._getSamples,this),1000/this.samplingFreq);
	}
}

WattMeter.prototype._getSamples=function() {
	if (this.currentSample) {
		if (this.currentSample.ts) {
			this.emit("sample",_.clone(this.currentSample));
		}
		this.currentSample.tsmin=(+new Date());
		this.currentSample.ts=0;
	}
}

