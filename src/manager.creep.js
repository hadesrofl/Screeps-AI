var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleGatherer = require('role.gatherer');
var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');

var managerCreep = {
  MAX_BUILDER: 2,
  MAX_UPGRADER: 2,
  MAX_HARVESTER: 3,
  MAX_GATHERER: 1,
  MAX_BIG_HARVESTER: 2,
  MAX_BIG_BUILDER: 2,
  MAX_BIG_UPGRADER: 2,
  MAX_BIG_GATHERER: 1,
  roles: [roleEnums.HARVESTER, roleEnums.GATHERER, roleEnums.BUILDER,
    roleEnums.UPGRADER],

  /** @param {STRUCTURE_SPAWN} spawn **/
  countCreeps: function(spawn) {
    var creeps = spawn.room.find(FIND_MY_CREEPS);
    var resultMap = new Map();
    for (var i in this.roles) {
      resultMap.set(this.roles[i], 0);
      delete Memory[spawn.room.name + ":" + this.roles[i]];
    }
    for (let i = 0; i < creeps.length; i++) {
      var role = creeps[i].memory.role;
      var big = creeps[i].memory.big;
      if (big) {
        role = "big" + role;
      }
      if (resultMap.has(role)) {
        resultMap.set(role, resultMap.get(role) + 1);
      } else {
        resultMap.set(role, 1);
      }
      Memory[spawn.room.name + ":" + role] = resultMap.get(role);
    }
    return resultMap;
  },
  /**  @param {STRUCTURE_SPAWN} spawn **/
  createCreep: function(spawn) {
    var creeps = this.countCreeps(spawn);
    if (creeps.size == 0 || creeps.get(roleEnums.HARVESTER) < 1) {
      roleHarvester.createCreep(spawn, false);
    } else if (creeps.get(roleEnums.GATHERER) < 1) {
      roleGatherer.createCreep(spawn, false);
    }
    creeps.forEach(function(value, key) {
      var ret = null;
      if (key == roleEnums.HARVESTER) {
        if (value < managerCreep.MAX_HARVESTER && roleHarvester.createCreep(
            spawn, false)) {
          ret = "Not Enough Harvester - creating!";
        }
      } else if (key == "big" + roleEnums.HARVESTER) {
        if (value < managerCreep.MAX_BIG_HARVESTER && roleHarvester.createCreep(
            spawn, true)) {
          ret = "Not Enough Big Harvester - creating!";
        }
      } else if (key == roleEnums.GATHERER) {
        if (value < managerCreep.MAX_GATHERER && roleGatherer.createCreep(
            spawn, false)) {
          ret = "Not Enough Gatherer - creating!";
        }
      } else if (key == "big" + roleEnums.GATHERER) {
        if (value < managerCreep.MAX_BIG_GATHERER && roleGatherer.createCreep(
            spawn, true)) {
          ret = "Not Enough Gatherer - creating!";
        }
      } else if (key ==
        roleEnums.BUILDER) {
        if (value < managerCreep.MAX_BUILDER && roleBuilder.createCreep(
            spawn, false)) {
          ret = "Not Enough Builder - creating!";
        }
      } else if (key == "big" + roleEnums.BUILDER) {
        if (value < managerCreep.MAX_BIG_BUILDER && roleBuilder.createCreep(
            spawn, true)) {
          ret = "Not Enough Big Builder - creating!";
        }
      } else if (key == roleEnums.UPGRADER) {
        if (value < managerCreep.MAX_UPGRADER && roleUpgrader.createCreep(
            spawn, false)) {
          ret = "Not Enough Upgrader - creating!";
        }
      } else if (key == "big" + roleEnums.UPGRADER) {
        if (value < managerCreep.MAX_BIG_UPGRADER && roleUpgrader.createCreep(
            spawn, false)) {
          ret = "Not Enough Big Upgrader - creating!";
        }
      }
      if (ret != null) {
        console.log(ret);
      }
    });
  },
  action: function() {
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      // Populate Map of Energy Sources
      if (managerHarvest.getSources().size == 0) {
        var sources = creep.room.find(FIND_SOURCES);
        for (let i = 0; i < sources.length; i++) {
          managerHarvest.addSource(sources[i]);
        }
      }
      if (creep.memory.role == roleEnums.HARVESTER) {
        roleHarvester.run(creep);
      }
      if (creep.memory.role == roleEnums.UPGRADER) {
        roleUpgrader.run(creep);
      }
      if (creep.memory.role == roleEnums.BUILDER) {
        roleBuilder.run(creep);
      }
      if (creep.memory.role == roleEnums.GATHERER) {
        roleGatherer.run(creep);
      }
    }
  },
  deleteMemory: function() {
    for (var i in Memory.creeps) {
      if (!Game.creeps[i]) {
        delete Memory.creeps[i];

      }
    }
  }


};

module.exports = managerCreep;
