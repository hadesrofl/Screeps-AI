var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var managerHarvest = require('manager.harvest');

var MAX_BUILDER = 2;
var MAX_UPGRADER = 2;
var MAX_HARVESTER = 2;
var RESET_HARVEST_MANAGER = 20;
var creepCounter = 0;
var harvesterCounter = 0;
var builderCounter = 0;
var upgraderCounter = 0;
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
      harvesterCounter++;
      roleHarvester.run(creep);
    }
    if (creep.memory.role == 'upgrader') {
      upgraderCounter++;
      roleUpgrader.run(creep);
    }
    if (creep.memory.role == 'builder') {
      builderCounter++;
      roleBuilder.run(creep);
    }
  }

  if (upgraderCounter < MAX_UPGRADER && roleUpgrader.canCreateCreep(Game.spawns
      .Home)) {
    roleUpgrader.createCreep(Game.spawns.Home);
    console.log("Created new Upgrader");
    upgraderCounter++;
  } else if (builderCounter < MAX_BUILDER && roleBuilder.canCreateCreep(Game.spawns
      .Home)) {
    roleBuilder.createCreep(Game.spawns.Home);
    console.log("Created new Builder");
    builderCounter++;
  } else if (harvesterCounter < MAX_HARVESTER && roleHarvester.canCreateCreep(
      Game.spawns.Home)) {
    roleHarvester.createCreep(Game.spawns.Home);
    console.log("Created new Harvester");
    harvesterCounter++;
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
