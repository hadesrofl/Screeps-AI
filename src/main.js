var managerRoom = require('manager.room');
var managerCreep = require('manager.creep');
var globals = require('globals');

Memory.cpuIndex = 0;
Memory.cpuUsage = 0.0;
Memory.cpuAvg = 0.0;
const NEAR_SPAWN_RANGE = 10;

/**TODO:
DRY for Builder & Upgrader (Prototyping?)
DRY for IRHarvester & Scout (Prototyping?)
**/

module.exports.loop = function() {
  managerCreep.deleteMemory();
  for (var name in Game.spawns) {
    var spawn = Game.spawns[name];
    var enemies = spawn.room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length) {
      Memory[spawn.room + ":defend"] = true;
      var attackedStructures = spawn.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return ((structure.structureType == STRUCTURE_WALL ||
                structure.structureType ==
                STRUCTURE_RAMPART) && structure.hits < globals.wallHealth
              .lowest &&
              structure.hits > 1) || structure
            .structureType != STRUCTURE_WALL && structure.structureType !=
            STRUCTURE_RAMPART &&
            structure.structureType != STRUCTURE_ROAD && structure.hits <
            structure.hitsMax * globals.safeModeRatio;
        }
      });
      var nearEnemies = spawn.pos.findInRange(FIND_HOSTILE_CREEPS,
        NEAR_SPAWN_RANGE);
      if (attackedStructures.length && nearEnemies.length) {
        var controller = spawn.room.controller;
        var safeModeTicks = controller.safeMode;
        var safeModeCD = controller.safeModeCooldown;
        var safeModeAvailable = controller.safeModeAvailable;
        if (safeModeTicks == undefined && safeModeCD == undefined &&
          safeModeAvailable) {
          spawn.room.controller.activateSafeMode();
        }
      }
    } else {
      Memory[spawn.room + ":defend"] = false;
    }
    var towers = spawn.room.find(FIND_STRUCTURES, {
      filter: (s) => {
        return s.structureType == STRUCTURE_TOWER;
      }
    });
    for (let i = 0; i < towers.length; i++) {
      var tower = towers[i];
      if (tower) {
        if (closestHostile) {
          tower.attack(closestHostile);
        }
        var closestDamagedStructure = tower.pos.findClosestByRange(
          FIND_STRUCTURES, {
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
        if (closestDamagedStructure) {
          tower.repair(closestDamagedStructure);
        }
        var closestHostile = tower.pos.findClosestByRange(
          FIND_HOSTILE_CREEPS);
      }
    }
    managerCreep.createCreeps(spawn);
  }

  managerCreep.action();

  if (Game.cpu.bucket < 10000 || Game.cpu.getUsed() > 30) {
    console.log("Bucket: " + Game.cpu.bucket + " Used CPU: " + Game.cpu.getUsed());
  }
  Memory.cpuUsage = Memory.cpuUsage + Game.cpu.getUsed();
  Memory.cpuIndex =
    Memory.cpuIndex + 1;
  Memory.cpuAvg = Memory.cpuUsage / Memory.cpuIndex;
  if (Memory.cpuIndex % 500 == 0) {
    console.log("Used CPU: " + (Memory.cpuUsage / Memory.cpuIndex));
  } else if (Memory.cpuIndex == 25000) {
    Memory.cpuIndex = 0;
    Memory.cpuUsage = 0;
  }
}
