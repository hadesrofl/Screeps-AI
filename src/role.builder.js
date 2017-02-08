var managerHarvest = require('manager.harvest');
var roleUpgrader = require('role.upgrader');

var roleBuilder = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],
  bigParts: [WORK, WORK, CARRY, MOVE, MOVE, MOVE],

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
          role: 'builder',
          building: false,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: 'builder',
          building: false,
          big: false
        });
      }
    }
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
      var structures = creep.room.find(FIND_MY_STRUCTURES);
      var target = null;
      for (let i = 0; i < structures.length; i++) {
        if (structures[i].hits < structures[i].hitsMax) {
          target = structures[i];
          break;
        }
      }
      if (target != null) {
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
      } else {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length) {
          target = targets[0];
          if (creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
              visualizePathStyle: {
                stroke: '#ffffff'
              }
            });
          }
        } else {
          creep.memory.building = false;
          roleUpgrader.run(creep);
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
