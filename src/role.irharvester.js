var roleEnums = require('role.enums');
var globals = require('globals');
var managerHarvest = require('manager.harvest');
var creepUtils = require('utils.creep');

const CREEP_RATIO = 0.2;
var irHarvester = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],
  bigParts: [WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],

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
          role: roleEnums.IR_HARVESTER,
          sourceId: 0,
          flag: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.IR_HARVESTER,
          sourceId: 0,
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
    var workCounter = 0;
    var carryCounter = 0;
    var moveCounter = 0;
    for (let i = 0; i < creep.body.length; i++) {
      var bodyPart = creep.body[i];
      if (bodyPart.hits > 0) {
        if (bodyPart.type == WORK) {
          workCounter++;
        } else if (bodyPart.type == MOVE) {
          moveCounter++;
        } else if (bodyPart.type == CARRY) {
          carryCounter++;
        }
      }
    }
    if (workCounter == 0 || moveCounter == 0 || carryCounter == 0) {
      console.log("IRHarvester: Move: " + moveCounter + "; Work: " +
        workCounter + "; Carry: " + carryCounter + " => Killing myself");
      creep.suicide();
    }
  },
  deliver: function(creep) {
    var spawn = Game.rooms[creep.memory.home].find(FIND_MY_SPAWNS)[0];
    // get home
    if (creep.room.name != creep.memory.home) {
      creepUtils.moveTo(creep, spawn, false);
    }
    // home => deliver
    else {
      var exit = creep.pos.findInRange(FIND_EXIT, 1);
      if (exit.length) {
        creepUtils.moveTo(creep, spawn, false);
      } else {
        var targets = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) &&
              structure.energy < structure.energyCapacity;
          }
        });
        if (targets.length) {
          if (creep.transfer(targets[0], RESOURCE_ENERGY) ==
            ERR_NOT_IN_RANGE) {
            creepUtils.moveTo(creep, targets[0], false);
          }
        }
        // all structures are full
        else {
          var inRange = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
              return (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER);
            }
          });
          if (inRange) {
            if (creep.transfer(inRange) == ERR_NOT_IN_RANGE) {
              creepUtils.moveTo(creep, inRange, false);
            } else if (creep.transfer(inRange) == ERR_FULL) {
              creep.drop(RESOURCE_ENERGY);
              creep.say("Dropping");
            }
          }
        }
      }
    }
    if (creep.memory.flag != 0) {
      creep.memory.flag = 0;
    }
    if (creep.memory.sourceId != 0) {
      creep.memory.sourceId = 0;
    }
  },
  /** @param {Creep} creep **/
  checkRoom: function(creep) {
    if (creep.room.name != creep.memory.home) {
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
  /** @param {Creep} creep **/
  setSource: function(creep) {
    if (creep.memory.flag == 0) {
      var flag = managerHarvest.getColdestFlag(creep);
      creep.memory.flag = flag;
    }
    var flagInRange = creep.pos.findInRange(FIND_FLAGS, 2, {
      filter: (f) => {
        return (f.name.match(flag));
      }
    });
    if (flagInRange.length && Game.flags[
        creep.memory.flag].room.name ==
      creep.room
      .name) {
      if (Memory[globals.PREFIX.MEM_SOURCES + creep.memory.flag] == 0) {
        var sources = creep.room.find(FIND_SOURCES);
        Memory[globals.PREFIX.MEM_SOURCES + creep.memory.flag] = sources.length;
      }
      /**var sources = creep.room.find(FIND_SOURCES);
      var sourceId = -1;
      if (sources.length) {
        if (sources.length == 1) {
          sourceId = sources[0].id;
        } else {
          var random = Math.floor((Math.random * sources.length));
          sourceId = sources[random];
        }
      }**/
      var sourceId = managerHarvest.getColdestSource(creep);

      if (!(sourceId < 0)) {
        var source = Game.getObjectById(sourceId);
        creepUtils.moveTo(creep, source, false);
        creep.memory.sourceId = sourceId;
        creep.memory.flag = flag;
      } else {
        Memory[globals.PREFIX.MEM_FLAG + flag] = false;
        Memory[globals.PREFIX.MEM_US_TIME + flag] = Game.time;
        Memory[globals.PREFIX.MEM_ALLOC + flag] = 0;
      }
    } else {
      creepUtils.moveTo(creep, Game.flags[creep.memory.flag], false);
    }

  },
  /** @param {Creep} creep **/
  init: function(creep) {
    if (creep.memory.flag == undefined) {
      creep.memory.flag = 0;
    }
    if (creep.memory.sourceId == undefined) {
      creep.memory.sourceId = 0;
    }
    if (creep.memory.home == undefined) {
      creep.memory.home = creep.room.name;
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    // set home
    this.init(creep);
    this.checkRoom(creep);
    if (creep.carry.energy == creep.carryCapacity || creep.ticksToLive <
      100 || creep.memory.home ==
      creep.room.name && creep.carry.energy >=
      creep.carryCapacity * CREEP_RATIO) {
      this.deliver(creep);
    }
    // set source
    else if (creep.memory.sourceId == 0 || creep.memory.flag == 0) {
      this.setSource(creep);
    } else if (creep.carry.energy < creep.carryCapacity) {
      if (creep.room.name == creep.memory.home) {
        creepUtils.moveTo(creep, Game.flags[creep.memory.flag], false);
      } else {
        var source = Game.getObjectById(creep.memory.sourceId);
        if (source != null) {
          if (source.energy > creep.carryCapacity - creep.carry.energy) {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
              creepUtils.moveTo(creep, source, false);
            }
          } else if (creep.carry.energy > 0) {
            this.deliver(creep);
          } else if (source.energy == 0) {
            creep.memory.sourceId == 0;
          }
        } else if (creep.carry.energy > 0) {
          this.deliver(creep);
        }
      }
    }
  }
};

module.exports = irHarvester;
