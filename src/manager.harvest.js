var roleEnums = require('role.enums');
var globals = require('globals');



const FLAG_REGEX = /harvest/;


var managerHarvest = {
  SOURCE_FULL: -2,
  ERR: -1,

  /** @param {Creep} creep **/
  getColdestSource: function(creep) {
    var sourceMap = new Map();
    var minCount = -1;
    var source = "";
    var sources = creep.room.find(FIND_SOURCES);
    var creeps = creep.room.find(FIND_MY_CREEPS);
    for (let i = 0; i < sources.length; i++) {
      var inUse = -1;
      if (sources[i].energy > 0) {
        var x = sources[i].pos.x;
        var y = sources[i].pos.y;
        var top = y - 1;
        var left = x - 1;
        var right = x + 1;
        var bottom = y + 1;
        var look = sources[i].room.lookForAtArea(LOOK_TERRAIN, top, left,
          bottom, right, true);
        for (let j = 0; j < look.length; j++) {
          if (look[j].terrain == 'wall') {
            inUse++;
          }
        }
        sourceMap.set(sources[i].id, inUse);
      }
    }
    for (let i = 0; i < creeps.length; i++) {
      var ctmp = creeps[i];
      if (ctmp.memory.sourceId != undefined) {
        for (let j = 0; j < sources.length; j++) {
          if (ctmp.memory.sourceId == sources[j].id) {
            if (sourceMap.has(sources[j].id)) {
              if (sourceMap.get(sources[j].id) < 8) {
                sourceMap.set(sources[j].id, sourceMap.get(sources[j].id) +
                  1);
              } else {
                ctmp.memory.sourceId = 0;
              }
            }
          }
        }
      }
    }
    sourceMap.forEach(function(value, key) {
      if (key != 0) {
        if (minCount == -1) {
          minCount = value;
          source = key;
        }
        if (value < minCount) {
          minCount = value;
          source = key;
        }
      }
    });
    if (minCount >= 0 && minCount < 8) {
      return source;
    } else if (minCount >= 8) {
      return -2;
    } else {
      return -1;
    }
  },
  initalizeFlags: function() {
    for (var name in Game.flags) {
      var flag = Game.flags[name];
      if (FLAG_REGEX.test(flag.name)) {
        if (Memory[globals.PREFIX.MEM_ALLOC + flag.name] == undefined) {
          Memory[globals.PREFIX.MEM_ALLOC + flag.name] = 0;
        }
        if (Memory[globals.PREFIX.MEM_US_TIME + flag.name] == undefined) {
          Memory[globals.PREFIX.MEM_US_TIME + flag.name] = 0;
        } else if (Game.time - Memory[globals.PREFIX.MEM_US_TIME + flag.name] >
          globals.FLAG_RECHECK_TIME) {
          Memory[globals.PREFIX.MEM_FLAG + flag.name] = true;
          Memory[globals.PREFIX.MEM_US_TIME + flag.name] = 0;
          Memory[globals.PREFIX.MEM_ALLOC + flag.name] = 0;
        }
        if (Memory[globals.PREFIX.MEM_FLAG + flag.name] == undefined) {
          Memory[globals.PREFIX.MEM_FLAG + flag.name] = true;
        }
        if (Memory[globals.PREFIX.MEM_SOURCES + flag.name] == undefined) {
          Memory[globals.PREFIX.MEM_SOURCES + flag.name] = 0;
        }
      }
    }
  },
  /** @param {Creep} creep **/
  getColdestFlag: function(creep) {
    this.initalizeFlags();
    var flagMap = new Map();
    var sourceMap = new Map();
    var minCount = -10;
    for (var name in Game.flags) {
      var flag = Game.flags[name];
      if (FLAG_REGEX.test(flag.name)) {
        flagMap.set(flag.name, 0);
        sourceMap.set(flag.name, Memory[globals.PREFIX.MEM_SOURCES +
          flag.name]);
      }
    }
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if (creep.memory.role == roleEnums.IR_HARVESTER) {
        if (flagMap.has(creep.memory.flag)) {
          flagMap.set(creep.memory.flag, flagMap.get(creep.memory.flag) +
            1);
          Memory[globals.PREFIX.MEM_ALLOC + creep.memory.flag] = flagMap.get(
            creep.memory.flag);
        }
      }
    }
    flagMap.forEach(function(value, key) {
      if (key !== 0) {
        if (minCount == -10) {
          minCount = value;
          flag = key;
        }
        if (value < minCount) {
          minCount = value;
          flag = key;
        }
      }
    });
    if (minCount >= 0 && minCount < 8) {
      return flag;
    } else if (minCount >= 8) {
      return SOURCE_FULL;
    } else {
      return ERR;
    }
  }
};

module.exports = managerHarvest;
