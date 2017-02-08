var managerHarvest = require('manager.harvest');

var roleHarvester = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],

  /** @param {STRUCTURE_SPAWN} spawn **/
  canCreateCreep: function(spawn) {
    return spawn.canCreateCreep(
      this.parts, null) == 0;
  },
  /** @param {STRUCTURE_SPAWN} spawn **/
  createCreep: function(spawn) {
    spawn.createCreep(this.parts, null, {
      role: 'harvester'
    });
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    var sourceId = managerHarvest.getSource(creep);
    if (sourceId < 0) {
      sourceId = managerHarvest.getColdestSource();
      if (sourceId < 0) {
        sourceId = creep.room.find(FIND_SOURCES)[0].id;
      }
      //console.log("Source id for " + creep.name + ": " + sourceId);
      managerHarvest.addAllocation(creep, sourceId);
    }
    if (creep.carry.energy < creep.carryCapacity) {
      var source = Game.getObjectById(sourceId);
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
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

module.exports = roleHarvester;
