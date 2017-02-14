var roleEnums = require('role.enums');
var globals = require('globals');
var creepUtils = require('utils.creep');

const FLAG_REGEX = /scout/;

var roleScout = {
  parts: [MOVE],
  bigParts: [MOVE, MOVE],

  /** @param {STRUCTURE_SPAWN} spawn **/
  canCreateCreep: function(spawn, big) {
    if (big) {
      return spawn.canCreateCreep(
        this.bigParts, null) == 0
    } else {
      return spawn.canCreateCreep(
        this.parts, null) == 0;
    }
  },
  /** @param {STRUCTURE_SPAWN} spawn **/
  createCreep: function(spawn, big) {
    if (this.canCreateCreep(spawn, big)) {
      if (big) {
        spawn.createCreep(this.bigParts, null, {
          role: roleEnums.SCOUT,
          flag: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.SCOUT,
          flag: 0,
          big: false
        });
      }
      return true;
    }
    return false;
  },
  /** @param {Creep} creep **/
  suicide: function(creep) {
    var moveCounter = 0;
    for (let i = 0; i < creep.body.length; i++) {
      var bodyPart = creep.body[i];
      if (bodyPart.hits > 0) {
        if (bodyPart.type == MOVE) {
          moveCounter++;
        }
      }
    }
    if (moveCounter == 0) {
      console.log("SCOUT: Move: " + moveCounter + " => Killing myself");
      creep.suicide();
    }
  },
  goHome: function(creep) {
    var spawn = Game.rooms[creep.memory.home].find(FIND_MY_SPAWNS)[0];
    creepUtils.moveTo(creep, spawn, false);
    if (creep.room.name == creep.memory.home) {
      if (creep.memory.flag != 0) {
        creep.memory.flag = 0;
      }
    }
  },
  /** @param {Creep} creep **/
  checkRoom: function(creep) {
    if (creep.room.name != creep.memory.home) {
      creep.say("Hello");
      var enemies = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: (c) => {
          return c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(
            RANGED_ATTACK);
        }
      });
      var towers = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_TOWER);
        }
      });
      var time = 0;
      var safe = false;
      if (enemies.length || towers.length) {
        time = Game.time;
      } else {
        safe = true;
      }
      var flags = creep.room.find(FIND_FLAGS);
      for (let i = 0; i < flags.length; i++) {
        Memory[globals.PREFIX.MEM_FLAG + flags[i].name] = safe;
        Memory[globals.PREFIX.MEM_US_TIME + flags[i].name] = time;
      }
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
      }
    }
  },
  /** @param {Creep} creep **/
  init: function(creep) {
    if (creep.memory.flag == undefined) {
      creep.memory.flag = 0;
    }
    if (creep.memory.home == undefined) {
      creep.memory.home = creep.room.name;
    }
    this.initalizeFlags();
  },
  /** @param {Creep} creep **/
  getColdestFlag: function(creep) {
    var flagMap = new Map();
    var minCount = -1;
    for (var name in Game.flags) {
      var flag = Game.flags[name];
      if (FLAG_REGEX.test(flag.name)) {
        flagMap.set(flag.name, 0);
      }
    }
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if (creep.memory.role == roleEnums.SCOUT) {
        if (flagMap.has(creep.memory.flag)) {
          flagMap.set(creep.memory.flag, flagMap.get(creep.memory.flag) +
            1);
          Memory[globals.PREFIX.MEM_ALLOC + creep.memory.flag] =
            flagMap.get(
              creep.memory.flag);
        }
      }
    }
    flagMap.forEach(function(value, key) {
      if (key !== 0) {
        if (minCount == -1) {
          minCount = value;
          flag = key;
        }
        if (value < minCount) {
          minCount = value;
          flag = key;
        }
      }
    });
    if (minCount >= 0) {
      return flag;
    } else {
      return -1;
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    // set home
    this.init(creep);
    if (creep.memory.flag == 0) {
      var flag = this.getColdestFlag(creep);
      if (!(flag < 0)) {
        creep.memory.flag = flag;
      }
    }
    this.checkRoom(creep);
    if (!Memory[globals.PREFIX.MEM_FLAG + creep.memory.flag]) {
      this.goHome(creep);
    } else if (creep.room.name != creep.memory.home) {
      for (var name in Game.flags) {
        var flag = Game.flags[name];
        if (flag.name == creep.memory.flag) {
          var inRange = creep.pos.findInRange(FIND_FLAGS, 2, {
            filter: (f) => {
              return f.name == creep.memory.flag;
            }
          });
          if (!inRange.length) {
            creepUtils.moveTo(creep, flag, false);
          }
        } else {
          creepUtils.moveTo(creep, Game.flags[creep.memory.flag], false);
        }
      }
    } else {
      creepUtils.moveTo(creep, Game.flags[creep.memory.flag], false);
    }
  }
};

module.exports = roleScout;
