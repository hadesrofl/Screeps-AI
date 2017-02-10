var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');

var roleUpgrader = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],
  bigParts: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],

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
          role: roleEnums.UPGRADER,
          upgrading: false,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.UPGRADER,
          upgrading: false,
          big: false
        });
      }
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {

    if (creep.memory.upgrading && creep.carry.energy == 0) {
      creep.memory.upgrading = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      if (creep.upgradeController(creep.room.controller) ==
        ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }
    } else {
      if (creep.memory.sourceId == undefined) {
        var sourceId = managerHarvest.getColdestSource(creep);
        if (sourceId < 0) {
          sourceId = creep.room.find(FIND_SOURCES)[0].id;
        }
        creep.memory.sourceId = sourceId;
      }
      var source = Game.getObjectById(creep.memory.sourceId);
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
      }
    }
  }
};

module.exports = roleUpgrader;
