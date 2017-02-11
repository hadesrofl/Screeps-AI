var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');

const standyByRange = 4;

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
  suicide: function(creep) {
    var carryCounter = 0;
    var moveCounter = 0;
    for (let i = 0; i < creep.body.length; i++) {
      var bodyPart = creep.body[i];
      if (bodyPart.hits > 0) {
        if (bodyPart.type == CARRY) {
          carryCounter++;
        } else if (bodyPart.type == MOVE) {
          moveCounter++;
        }
      }
    }
    if (carryCounter == 0 || moveCounter == 0) {
      console.log("Gatherer: Move: " + moveCounter + "; Carry: " +
        carryCounter + " => Killing myself");
      creep.suicide();
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    if (!creep.memory.gathering && creep.carry.energy == 0) {
      creep.memory.gathering = true;
      creep.say('🔄 gather');
    }
    if (creep.memory.gathering && creep.carry.energy >= (creep.carryCapacity *
        0.6)) {
      creep.memory.gathering = false;
      creep.say('🚧 deliver');
    }
    if (creep.memory.gathering) {
      var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
      if (target) {
        if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
      } else {
        var nearest = creep.pos.findInRange(FIND_MY_CREEPS, standyByRange, {
          filter: (c) => {
            return c.memory.role == roleEnums.HARVESTER;
          }
        });
        if (nearest.length) {
          return;
        }
        var harvester = creep.room.find(FIND_MY_CREEPS, {
          filter: (c) => {
            return c.memory.role == roleEnums.HARVESTER;
          }
        });
        if (harvester.length) {
          if (harvester.length == 1) {
            target = harvester[0];
          } else {
            var random = Math.floor((Math.random() * harvester.length) + 1);
            target = harvester[random];
          }
          if (target) {
            creep.moveTo(target, {
              visualizePathStyle: {
                stroke: '#ffffff'
              }
            });
          }
        }
      }
    } else {
      var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION ||
              structure.structureType == STRUCTURE_SPAWN ||
              structure.structureType == STRUCTURE_TOWER || structure
              .structureType == STRUCTURE_CONTAINER) &&
            structure.energy < structure.energyCapacity;
        }
      });
      if (!targets) {
        targets = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) &&
              structure.energy < structure.energyCapacity;
          }
        });
      }
      if (targets) {
        if (creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets, {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        }
      } else if (creep.carry < creep.carryCapacity) {
        var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
        if (target) {
          if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
              visualizePathStyle: {
                stroke: '#ffffff'
              }
            });
          }
        }
      }
    }
  }
};

module.exports = roleGatherer;
