var managerHarvest = require('manager.harvest');
var roleUpgrader = require('role.upgrader');
var roleEnums = require('role.enums');

const energyRatio = 0.8;
var roleBuilder = {
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
          role: roleEnums.BUILDER,
          building: false,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.BUILDER,
          building: false,
          big: false
        });
      }
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    creep.memory.upgrading = false;
    if (creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.say('🚧 build');
    }
    if (creep.memory.building) {
      var structures = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
        filter: (structure) => {
          return (structure.structureType != STRUCTURE_CONTROLLER &&
            structure.structureType != STRUCTURE_SPAWN);
        }
      });
      // near structures need repair?
      if (structures.length > 0) {
        creep.say(structures[0].name);
        for (let i = 0; i < structures.length; i++) {
          if (structures[i].hits < structures[i].hitsMax) {
            creep.repair(structures[i]);
          }
        }
      }
      // build near construction site
      else if ((structures = creep.pos.findInRange(
          FIND_CONSTRUCTION_SITES, 3)).length) {
        creep.build(structures[0]);
      }
      // nothing next to me
      else {
        var coin = Math.floor((Math.random() * 2) + 1);
        // repair
        if (coin == 1) {
          structures = creep.room.find(FIND_MY_STRUCTURES);
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
          }
        }
        // build
        else if (coin == 2) {
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
      }
    }
    // get resources
    else {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION ||
              structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy > (structure.energyCapacity *
              energyRatio);
        }
      });
      if (targets.length > 0) {
        if (creep.withdraw(targets[0], RESOURCE_ENERGY) ==
          ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
      } else {
        if (creep.memory.sourceId == undefined) {
          var sourceId = managerHarvest.getSource(creep);
          if (sourceId < 0) {
            sourceId = managerHarvest.getColdestSource();
            if (sourceId < 0) {
              sourceId = creep.room.find(FIND_SOURCES)[0].id;
            }
            managerHarvest.addAllocation(creep, sourceId);
            creep.memory.sourceId = sourceId;
          }
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
  }
};

module.exports = roleBuilder;
