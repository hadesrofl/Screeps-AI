var managerHarvest = require('manager.harvest');
var roleUpgrader = require('role.upgrader');
var roleEnums = require('role.enums');
var creepUtils = require('utils.creep');
var globals = require('globals');

const waiting = 20;
const waitRange = 4;
const actionRange = 5;

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
          sourceId: 0,
          waitedTicks: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.BUILDER,
          building: false,
          currentTarget: 0,
          sourceId: 0,
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
  goToLastTarget: function(creep) {
    var target = Game.getObjectById(creep.memory.currentTarget);
    if (target instanceof ConstructionSite) {
      if (target.progress < target.progressTotal) {
        var ret = creep.build(target);
        if (ret == ERR_NOT_IN_RANGE) {
          creepUtils.moveTo(creep, target, false);
        } else if (ret != OK) {
          creep.memory.currentTarget = 0;
          var dir = Math.floor((Math.random() * 8) + 1);
          creep.move(dir);
        }
      }
    } else if (target instanceof Structure) {
      var ret = creep.repair(target);
      if (ret == ERR_NOT_IN_RANGE) {
        creepUtils.moveTo(creep, target, false);
      } else if (target.hits == target.hitsMax) {
        creep.memory.currentTarget = 0;
        var dir = Math.floor((Math.random() * 8) + 1);
        creep.move(dir);
      } else if (ret != OK) {
        creep.memory.currentTarget = 0;
        var dir = Math.floor((Math.random() * 8) + 1);
        creep.move(dir);
      }
    } else {
      creep.memory.currentTarget = 0;
      var dir = Math.floor((Math.random() * 8) + 1);
      creep.move(dir);
    }
  },
  /** @param {Creep} creep **/
  checkSurroundings: function(creep) {
    var structures = creep.pos.findInRange(FIND_STRUCTURES, actionRange, {
      filter: (structure) => {
        return (structure.structureType != STRUCTURE_CONTROLLER &&
            structure.structureType != STRUCTURE_SPAWN &&
            structure
            .structureType != STRUCTURE_WALL && structure.structureType !=
            STRUCTURE_RAMPART && structure.structureType !=
            STRUCTURE_ROAD && structure
            .hits < structure.hitsMax) || (structure.structureType ==
            STRUCTURE_ROAD && structure.hits < globals.lowestRoadHealth
          ) || (structure.structureType ==
            STRUCTURE_WALL && structure.hits < structure.hitsMax *
            globals.wallHealth.ratio) || structure.structureType ==
          STRUCTURE_RAMPART && structure.hits < structure.hitsMax *
          globals.rampartHealthRatio;
      }
    });
    // near structures need repair?
    if (structures.length) {
      creep.memory.currentTarget = structures[0].id;
      if (creep.repair(structures[0]) == ERR_NOT_IN_RANGE) {
        creepUtils.moveTo(creep, structures[0], false);
      }
      return true;
    }
    // build near construction site
    else if ((sites = creep.pos.findInRange(
        FIND_CONSTRUCTION_SITES, actionRange)).length) {
      creep.memory.currentTarget = sites[0].id;
      if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
        creepUtils.moveTo(creep, sites[0], false);
      }
      return true;
    }
    return false;
  },
  /** @param {Creep} creep **/
  selectNewTarget: function(creep) {
    structures = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType ==
            STRUCTURE_WALL && structure.hits < (structure.hitsMax *
              globals.wallHealth.ratio) && structure.hits > 0) || (
            structure.structureType == STRUCTURE_ROAD && structure.hits <
            globals.lowestRoadHealth) ||
          (
            structure.structureType == STRUCTURE_RAMPART &&
            structure.hits > 0 && structure.hits < structure.hitsMax *
            globals.rampartHealthRatio
          ) || structure.structureType !=
          STRUCTURE_ROAD && structure.structureType !=
          STRUCTURE_WALL && structure.structureType !=
          STRUCTURE_RAMPART && structure.hits < structure.hitsMax;
      }
    });
    sites = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (structures.length && sites.length) {
      var coin = Math.floor((Math.random() * 2) + 1);
      // repair
      if (coin == 1) {
        creep.memory.currentTarget = structures[0].id;
        if (creep.repair(structures[0]) == ERR_NOT_IN_RANGE) {
          creepUtils.moveTo(creep, structures[0], false);
        }
      }
      // build
      else if (coin == 2) {
        creep.memory.currentTarget = sites[0].id;
        if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
          creepUtils.moveTo(creep, sites[0], false);
        }
      }
      return true;
    } else if (structures.length) {
      creep.memory.currentTarget = structures[0].id;
      if (creep.repair(structures[0]) == ERR_NOT_IN_RANGE) {
        creepUtils.moveTo(creep, structures[0], false);
      }
      return true;
    } else if (sites.length) {
      creep.memory.currentTarget = sites[0].id;
      if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
        creepUtils.moveTo(creep, sites[0], false);
      }
      return true;
    }
    return false;
  },
  /** @param {Creep} creep **/
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
              structure.structureType == STRUCTURE_SPAWN) &&
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
              return s.structureType ==
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
            return (s.structureType ==
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
  run: function(creep) {
    this.suicide(creep);
    creep.memory.upgrading = false;
    if (creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      creep.memory.currentTarget = 0;
      creep.memory.waitedTicks = 0;
      creep.memory.sourceId = 0;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.memory.waitedTicks = 0;
      creep.say('🚧 build');
    }
    if (creep.memory.building) {
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
      if (creep.memory.currentTarget != 0) {
        this.goToLastTarget(creep);
      } else {
        var sites;
        var structures;
        if (!this.checkSurroundings(creep)) {
          if (!this.selectNewTarget(creep)) {
            creep.memory.building = false;
            roleUpgrader.run(creep);
          }
        }
      }
    }
    // get resources
    else {
      this.harvest(creep);
    }
  }
};

module.exports = roleBuilder;
