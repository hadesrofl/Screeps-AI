var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var managerHarvest = require('manager.harvest');

var MAX_BUILDER = 2;
var MAX_UPGRADER = 2;
var MAX_HARVESTER = 2;
var MAX_BIG_HARVESTER = 1;
var RESET_HARVEST_MANAGER = 20;
var creepCounter = 0;
var harvesterCounter = 0;
var bigHarvesterCounter = 0;
var builderCounter = 0;
var bigBuilderCounter = 0;
var upgraderCounter = 0;
var bigUpgraderCounter = 0;
var lastResetTime = 0;

module.exports.loop = function() {

  for (var i in Memory.creeps) {
    if (!Game.creeps[i]) {
      delete Memory.creeps[i];
    }
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

  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    creepCounter++;
    // Populate Map of Energy Sources
    if (managerHarvest.getSources().size == 0) {
      var sources = creep.room.find(FIND_SOURCES);
      for (let i = 0; i < sources.length; i++) {
        managerHarvest.addSource(sources[i]);
      }
    }
    if (creep.memory.role == 'harvester') {
      if (creep.memory.big) {
        bigHarvesterCounter++;
      } else {
        harvesterCounter++;
      }
      roleHarvester.run(creep);
    }
    if (creep.memory.role == 'upgrader') {
      if (creep.memory.big) {
        bigUpgraderCounter++;
      } else {
        upgraderCounter++;
      }
      roleUpgrader.run(creep);
    }
    if (creep.memory.role == 'builder') {
      if (creep.memory.big) {
        bigBuilderCounter++;
      } else {
        builderCounter++;
      }
      roleBuilder.run(creep);
    }
  }

  if (upgraderCounter < MAX_UPGRADER && roleUpgrader.canCreateCreep(Game.spawns
      .Home, false)) {
    roleUpgrader.createCreep(Game.spawns.Home, false);
    console.log("Created new Upgrader");
    upgraderCounter++;
  } else if (builderCounter < MAX_BUILDER && roleBuilder.canCreateCreep(Game.spawns
      .Home, false)) {
    roleBuilder.createCreep(Game.spawns.Home, false);
    console.log("Created new Builder");
    builderCounter++;
  } else if (harvesterCounter < MAX_HARVESTER && roleHarvester.canCreateCreep(
      Game.spawns.Home, false)) {
    roleHarvester.createCreep(Game.spawns.Home, false);
    console.log("Created new Harvester");
    harvesterCounter++;
  } else if (bigHarvesterCounter < MAX_BIG_HARVESTER && roleHarvester.canCreateCreep(
      Game.spawns.Home, true)) {
    roleHarvester.createCreep(Game.spawns.Home, true);
    console.log("Created new Big Harvester");
    bigHarvesterCounter++;
  }
  creepCounter = 0;
  harvesterCounter = 0;
  builderCounter = 0;
  upgraderCounter = 0;

  /*  if ((Game.time - lastResetTime) >= RESET_HARVEST_MANAGER) {
      console.log("Last Reset Time: " + lastResetTime + " Game Time: " + Game.time);
      console.log("Clearing Harvest Manager!");
      managerHarvest.clear();
      lastResetTime = Game.time;
    }*/
  console.log("Bucket: " + Game.cpu.bucket + " Used CPU: " + Game.cpu.getUsed());
}
