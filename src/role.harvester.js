var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');

var roleHarvester = {
  parts: [WORK, CARRY, CARRY, MOVE, MOVE],
  bigParts: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],

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
          role: roleEnums.HARVESTER,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.HARVESTER,
          big: false
        });
      }
      return true;
    }
    return false;
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
      console.log("Harvester: Move: " + moveCounter + "; Work: " +
        workCounter + "; Carry: " + carryCounter + " => Killing myself");
      creep.suicide();
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    if (creep.memory.sourceId == undefined) {
      var sourceId = managerHarvest.getColdestSource(creep);
      if (sourceId < 0) {
        sourceId = creep.room.find(FIND_SOURCES)[0].id;
      }
      creep.memory.sourceId = sourceId;
    }
    var gathererCounter = Memory[creep.room.name + ":" + roleEnums.GATHERER];
    var harvesterCounter = Memory[
      creep.room.name + ":" + roleEnums.HARVESTER];
    if (creep.carry.energy < creep.carryCapacity) {
      var source = Game.getObjectById(creep.memory.sourceId);
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
      }
    } else if (gathererCounter == undefined || gathererCounter == 0 ||
      gathererCounter < Math.floor(
        (harvesterCounter / 2))) {
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
      } else {
        creep.say("Dropping");
        creep.drop(RESOURCE_ENERGY);
      }
    } else {
      creep.say("Dropping");
      creep.drop(RESOURCE_ENERGY);
    }
  }
};

module.exports = roleHarvester;
