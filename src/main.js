var managerRoom = require('manager.room');
var managerCreep = require('manager.creep');

Memory.cpuIndex = 0;
Memory.cpuUsage = 0.0;
Memory.cpuAvg = 0.0;

module.exports.loop = function() {

  managerCreep.deleteMemory();
  for (var name in Game.spawns) {
    var spawn = Game.spawns[name];
    var enemies = spawn.room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length) {
      Memory[spawn.room + ":defend"] = true;
      var attackedStructures = spawn.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return ((structure.structureType ==
                STRUCTURE_WALL || structure.structureType ==
                STRUCTURE_RAMPART) && structure.hits < 5000 &&
              structure.hits >
              1) || structure
            .structureType !=
            STRUCTURE_WALL &&
            structure.structureType != STRUCTURE_ROAD && structure.hits <
            structure.hitsMax;
        }
      });
      if (attackedStructures.length) {
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
    managerCreep.createCreeps(spawn);
  }

  var tower = Game.getObjectById('TOWER_ID');
  if (tower) {
    var closestDamagedStructure = tower.pos.findClosestByRange(
      FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax
      });
    if (closestDamagedStructure) {
      tower.repair(closestDamagedStructure);
    }

    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      tower.attack(closestHostile);
    }
  }

  managerCreep.action();

  if (Game.cpu.bucket < 10000 || Game.cpu.getUsed() > 10) {
    console.log("Bucket: " + Game.cpu.bucket + " Used CPU: " + Game.cpu.getUsed());
  }
  Memory.cpuUsage = Memory.cpuUsage + Game.cpu.getUsed();
  Memory.cpuIndex = Memory.cpuIndex + 1;
  Memory.cpuAvg = Memory.cpuUsage / Memory.cpuIndex;
  if (Memory.cpuIndex % 500 == 0) {
    console.log("Used CPU: " + (Memory.cpuUsage / Memory.cpuIndex));
  } else if (Memory.cpuIndex == 25000) {
    Memory.cpuIndex = 0;
    Memory.cpuUsage = 0;
  }
}
