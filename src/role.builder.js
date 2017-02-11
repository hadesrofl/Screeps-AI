var managerHarvest = require('manager.harvest');
var roleUpgrader = require('role.upgrader');
var roleEnums = require('role.enums');

const energyAmount = 50;
const energyRatio = 0.7;
const roomCapacity = 300;
const waiting = 20;
const waitRange = 3;
const wallHealthRatio = 0.000050;

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
          currentTarget: 0,
          waitedTicks: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.BUILDER,
          building: false,
          currentTarget: 0,
          waitedTicks: 0,
          big: false
        });
      }
    }
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
      console.log("Builder: Move: " + moveCounter + "; Work: " +
        workCounter + "; Carry: " + carryCounter + " => Killing myself");
      creep.suicide();
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    creep.memory.upgrading = false;
    if (creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      creep.memory.currentTarget = 0;
      creep.memory.waitedTicks = 0;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.say('🚧 build');
    }
    if (creep.memory.building) {
      if (creep.memory.currentTarget != 0) {
        var target = Game.getObjectById(creep.memory.currentTarget);
        if (creep.repair(target) == ERR_NOT_IN_RANGE || creep.build(target) ==
          ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
        return;
      }
      var sites;
      var structures = creep.pos.findInRange(FIND_MY_STRUCTURES, 5, {
        filter: (structure) => {
          return (structure.structureType != STRUCTURE_CONTROLLER &&
            structure.structureType != STRUCTURE_SPAWN &&
            structure
            .structureType != STRUCTURE_WALL && structure
            .hits < structure.hitsMax) && (structure.structureType ==
            STRUCTURE_WALL && structure.hits < structure.hitsMax *
            wallHealthRatio);
        }
      });
      // near structures need repair?
      if (structures.length > 0) {
        creep.memory.currentTarget = structures[0].id;
        creep.repair(structures[0]);
      }
      // build near construction site
      else if ((sites = creep.pos.findInRange(
          FIND_CONSTRUCTION_SITES, 3)).length) {
        creep.memory.currentTarget = sites[0].id;
        creep.build(sites[0]);
      }
      // nothing next to me
      else {
        structures = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType ==
                STRUCTURE_WALL && structure.hits < (structure.hitsMax *
                  wallHealthRatio) && structure.hits > 0) || (
                structure.structureType == STRUCTURE_RAMPART &&
                structure.hits > 0) || structure.structureType !=
              STRUCTURE_WALL && structure.hits < structure.hitsMax;
          }
        });
        sites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (structures.length && sites.length) {
          var coin = Math.floor((Math.random() * 2) + 1);
          // repair
          if (coin == 1) {
            creep.memory.currentTarget = structures[0].id;
            if (creep.repair(structures[0]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(structures[0], {
                visualizePathStyle: {
                  stroke: '#ffffff'
                }
              });
            }
          }
          // build
          else if (coin == 2) {
            creep.memory.currentTarget = sites[0].id;
            if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(sites[0], {
                visualizePathStyle: {
                  stroke: '#ffffff'
                }
              });
            }
          }
        } else if (structures.length) {
          creep.memory.currentTarget = structures[0].id;
          if (creep.repair(structures[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structures[0], {
              visualizePathStyle: {
                stroke: '#ffffff'
              }
            });
          }
        } else if (sites.length) {
          creep.memory.currentTarget = sites[0].id;
          if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sites[0], {
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
    //}
    // get resources
    else {
      var targets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
          return ((structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN) &&
              structure.energy >= structure.energyCapacity *
              energyRatio || structure.structureType ==
              STRUCTURE_CONTAINER && structure.energy >= energyAmount
            ) && creep.room.energyAvailable >
            roomCapacity;
        }
      });
      //FIXME: remember ticks I waited
      //var sourceId = creep.pos.findClosestByRange(FIND_SOURCES).id;
      var sourceId = managerHarvest.getColdestSource(creep);
      if (sourceId < 0) {
        sourceId = creep.room.find(FIND_SOURCES)[0].id;
      }
      creep.memory.sourceId = sourceId;
      var source = Game.getObjectById(creep.memory.sourceId);
      if (targets.length) {
        var rangeSource = creep.pos.getRangeTo(source);
        var rangeStructure = creep.pos.getRangeTo(targets[0]);
        if (rangeStructure < rangeSource || creep.memory.waitedTicks >
          waiting) {
          if (creep.withdraw(targets[0], RESOURCE_ENERGY) ==
            ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], {
              visualizePathStyle: {
                stroke: '#ffffff'
              }
            });
          }
        } else {
          if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            if (creep.pos.getRangeTo(source) < waitRange) {
              creep.memory.waitedTicks += 1;
            }
            creep.moveTo(source, {
              visualizePathStyle: {
                stroke: '#ffaa00'
              }
            });
          }
        }
      } else {
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
