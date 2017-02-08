var managerHarvest = require('manager.harvest');

var roleUpgrader = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],

  /** @param {STRUCTURE_SPAWN} spawn **/
  canCreateCreep: function(spawn) {
    return spawn.canCreateCreep(
      this.parts, null) == 0;
  },
  /** @param {STRUCTURE_SPAWN} spawn **/
  createCreep: function(spawn) {
    spawn.createCreep(this.parts, null, {
      role: 'upgrader',
      upgrading: false
    });
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
      var sourceId = managerHarvest.getSource(creep);
      if (sourceId < 0) {
        sourceId = managerHarvest.getColdestSource();
        if (sourceId < 0) {
          sourceId = creep.room.find(FIND_SOURCES)[0].id;
        }
        //console.log("Source id for " + creep.name + ": " + sourceId);
        managerHarvest.addAllocation(creep, sourceId);
      }
      var source = Game.getObjectById(sourceId);
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
