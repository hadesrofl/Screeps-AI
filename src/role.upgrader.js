var managerHarvest = require('manager.harvest');
var creepUtils = require('utils.creep');
var roleEnums = require('role.enums');
var globals = require('globals');

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
          sourceId: 0,
          waitedTicks: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.UPGRADER,
          upgrading: false,
          sourceId: 0,
          waitedTicks: 0,
          big: false
        });
      }
    }
  },
  harvest: function(creep) {
    var target = creep.memory.sourceId;
    if (creep.memory.sourceId == 0) {
      var sourceId = managerHarvest.getColdestSource(creep);
      if (sourceId == managerHarvest.ERR) {
        sourceId = creep.room.find(FIND_SOURCES)[0].id;
      }
      target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return ((structure.structureType == STRUCTURE_EXTENSION ||
              structure.structureType == STRUCTURE_SPAWN ||
              structure
              .structureType == STRUCTURE_CONTAINER) &&
            structure.energy >= structure.energyCapacity *
            globals.transferRestricts.energyRatio && creep.room
            .energyAvailable >
            globals.transferRestricts.roomCapacity);
        }
      });
      if (target) {
        if (sourceId != managerHarvest.SOURCE_FULL && sourceId !=
          managerHarvest.ERR) {
          var source = Game.getObjectById(sourceId);
          var rangeSource = creep.pos.getRangeTo(source);
          var rangeStructure = creep.pos.getRangeTo(target);
          if (rangeStructure < rangeSource || creep.memory.waitedTicks >
            waiting) {
            creep.memory.sourceId = target.id;
            if (creep.withdraw(target, RESOURCE_ENERGY) ==
              ERR_NOT_IN_RANGE) {
              creepUtils.moveTo(creep, target, false);
            }
          } else {
            creep.memory.sourceId = sourceId;
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
              if (creep.pos.getRangeTo(source) < waitRange) {
                creep.memory.waitedTicks += 1;
              }
              creepUtils.moveTo(creep, source, false);
            }
          }
        } else {
          target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => {
              return s.structureType == STRUCTURE_CONTAINER || s.structureType ==
                STRUCTURE_EXTENSION || s.structureType ==
                STRUCTURE_SPAWN && s.energy >= globals.transferRestricts
                .energyAmount;
            }
          });
          creep.memory.sourceId = target.id;
          if (creep.withdraw(target, RESOURCE_ENERGY) ==
            ERR_NOT_IN_RANGE) {
            creepUtils.moveTo(creep, target, false);
          }
        }
      } else {
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER || s.structureType ==
                STRUCTURE_EXTENSION || s.structureType ==
                STRUCTURE_SPAWN) && s.energy >= globals.transferRestricts
              .energyAmount;
          }
        });
        if (sourceId == managerHarvest.SOURCE_FULL && target) {
          creep.memory.sourceId = target.id;
          if (creep.withdraw(target, RESOURCE_ENERGY) ==
            ERR_NOT_IN_RANGE) {
            creepUtils.moveTo(creep, target, false);
          }
        } else if (!(sourceId < 0)) {
          var source = Game.getObjectById(sourceId);
          creep.memory.sourceId = sourceId;
          if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creepUtils.moveTo(creep, source, false);
          }
        }
      }
    } else if (!(creep.memory.sourceId <= 0)) {
      target = Game.getObjectById(creep.memory.sourceId);
      if (target instanceof Structure) {
        if (target.energy >= globals.transferRestricts.energyAmount &&
          creep
          .room.energyAvailable > globals.transferRestricts.roomCapacity) {
          if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creepUtils.moveTo(creep, target, false);
          }
        } else if (target.energy < globals.transferRestricts.energyAmount) {
          creep.memory.sourceId = 0;
        } else {
          var sourceId = managerHarvest.getColdestSource(creep);
          if (sourceId == managerHarvest.ERR) {
            sourceId = creep.room.find(FIND_SOURCES)[0].id;
          } else if (sourceId != managerHarvest.SOURCE_FULL) {
            target = Game.getObjectById(sourceId);
            creep.memory.sourceId = sourceId;
            if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
              creepUtils.moveTo(creep, target, false);
            }
          }
        }
      } else {
        if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
          creepUtils.moveTo(creep, target, false);
        }
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
      creep.memory.sourceId = 0;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      if (!(creep.memory.sourceId <= 0)) {
        var target = Game.getObjectById(creep.memory.sourceId);
        if (target instanceof Source) {
          var range = creep.pos.getRangeTo(target);
          if (range > 1) {
            creep.memory.sourceId = 0;
          }
        }
      } else {
        creep.memory.sourceId = 0;
      }
      if (creep.upgradeController(creep.room.controller) ==
        ERR_NOT_IN_RANGE) {
        creepUtils.moveTo(creep, creep.room.controller, false);
      }
    } else {
      this.harvest(creep);
    }
  }
};

module.exports = roleUpgrader;
