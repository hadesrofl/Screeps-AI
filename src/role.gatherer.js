var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');

var roleGatherer = {
  parts: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
  bigParts: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],

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
          role: roleEnums.GATHERER,
          gathering: false,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.GATHERER,
          gathering: false,
          big: false
        });
      }
      return true;
    }
    return false;
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    if (!creep.memory.gathering && creep.carry.energy == 0) {
      creep.memory.gathering = true;
      creep.say('🔄 gather');
    }
    if (creep.memory.gathering && creep.carry.energy >= (creep.carryCapacity * 0.6)) {
      creep.memory.gathering = false;
      creep.say('🚧 deliver');
    }
    if(creep.memory.gathering){
      var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
      if(target) {
        if(creep.pickup(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
      }
    } else {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION ||
              structure.structureType == STRUCTURE_SPAWN ||
              structure.structureType == STRUCTURE_TOWER) &&
            structure.energy < structure.energyCapacity;
        }
      });
      if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
      }
    }
  }
};

module.exports = roleGatherer;
