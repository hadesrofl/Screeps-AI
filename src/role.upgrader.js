var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');

const energyAmount = 50;
const energyRatio = 0.7;
const roomCapacity = 300;
const waiting = 20;
const waitRange = 3;

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
          waitedTicks: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.UPGRADER,
          upgrading: false,
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
      console.log("Upgrader: Move: " + moveCounter + "; Work: " +
        workCounter + "; Carry: " + carryCounter + " => Killing myself");
      creep.suicide();
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    if (creep.memory.upgrading && creep.carry.energy == 0) {
      creep.memory.upgrading = false;
      creep.memory.waitedTicks = 0;
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
      // FIXME:remember ticks I waited
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

module.exports = roleUpgrader;
