var managerHarvest = require('manager.harvest');

var roleBuilder = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],

  /** @param {STRUCTURE_SPAWN} spawn **/
  canCreateCreep: function(spawn) {
    return spawn.canCreateCreep(
      this.parts, null) == 0;
  },
  /** @param {STRUCTURE_SPAWN} spawn **/
  createCreep: function(spawn) {
    spawn.createCreep(this.parts, null, {
      role: 'builder',
      building: false
    });
  },
  /** @param {Creep} creep **/
  run: function(creep) {

    if (creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.say('🚧 build');
    }

    if (creep.memory.building) {
      var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
      if (targets.length) {
        if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
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

module.exports = roleBuilder;
