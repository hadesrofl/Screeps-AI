var roleHarvester = require('role.harvester');
var roleIrHarvester = require('role.irharvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleGatherer = require('role.gatherer');
var roleScout = require('role.scout');
var roleRaider = require('role.raider');
var managerHarvest = require('manager.harvest');
var roleEnums = require('role.enums');
var roleDefender = require('role.defender');
var globals = require('globals');

var managerCreep = {
  // not corresponding to ratios
  MAX_SCOUT: 2,
  MAX_RAIDER: 0,
  MAX_IR_HARVESTER: 4,
  // corresponding to ratios
  MAX_BUILDER: 0,
  MAX_UPGRADER: 0,
  MAX_HARVESTER: 0,
  MAX_GATHERER: 2,
  MAX_DEFENDER: 2,
  MAX_BIG_HARVESTER: 1.5,
  MAX_BIG_BUILDER: 1.5,
  MAX_BIG_UPGRADER: 1,
  MAX_BIG_GATHERER: 1.5,
  MAX_BIG_DEFENDER: 2,
  SMALL_RATIO: 2.0,
  BIG_RATIO: 2.0,
  PEACE_RATIO: 0.5,
  roles: [roleEnums.SCOUT, roleEnums.RAIDER, roleEnums.HARVESTER, roleEnums.IR_HARVESTER,
    roleEnums.GATHERER,
    roleEnums.BUILDER,
    roleEnums.UPGRADER, roleEnums.DEFENDER],

  /** @param {STRUCTURE_SPAWN} spawn **/
  countCreeps: function(spawn) {
    var creeps = new Array();
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if (creep.room.name == spawn.room.name || (creep.memory.role ==
          roleEnums.IR_HARVESTER || creep.memory.role == roleEnums.SCOUT ||
          creep.memory.role == roleEnums.RAIDER) &&
        creep.memory.home == spawn.room.name) {
        creeps.push(creep);
      }
    }
    var resultMap = new Map();
    for (var i in this.roles) {
      resultMap.set("big" + this.roles[i], 0);
      resultMap.set(this.roles[i], 0);
      delete Memory[spawn.room.name + ":" + this.roles[i]];
      delete Memory[spawn.room.name + ":big" + this.roles[i]]
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
      if (role != undefined) {
        Memory[spawn.room.name + ":" + role] = resultMap.get(role);
      }
    }
    return resultMap;
  },
  /**  @param {STRUCTURE_SPAWN} spawn **/
  createCreeps: function(spawn) {
    var creeps = this.countCreeps(spawn);
    var smallRatio = 1;
    var bigRatio = 1;
    if (creeps.size == 0 || creeps.get(roleEnums.HARVESTER) < 1 && creeps.get(
        "big" + roleEnums.HARVESTER) < 1) {
      if (roleHarvester.createCreep(spawn, false)) {
        console.log("No Harvester - creating!");
      }
      return;
    } else if (creeps.get(roleEnums.GATHERER) < 1 && creeps.get("big" +
        roleEnums.GATHERER) < 1) {
      if (roleGatherer.createCreep(spawn, false)) {
        console.log("No Gatherer - creating!");
      }
      return;
    }
    var energyCapacityMax = spawn.room.energyCapacityAvailable;
    if (energyCapacityMax < globals.evolutionEnergyCap.small) {
      smallRatio = managerCreep.SMALL_RATIO;
    } else if (energyCapacityMax >= globals.evolutionEnergyCap
      .small) {
      bigRatio = managerCreep.BIG_RATIO;
      smallRatio = 0.5;
    }
    creeps.forEach(function(value, key) {
      var ret = null;
      // war
      if (Memory[spawn.room + ":defend"]) {
        if (key == roleEnums.DEFENDER) {
          if (value < managerCreep.MAX_DEFENDER * smallRatio &&
            roleDefender.createCreep(
              spawn, false)) {
            ret = "Not Enough Defender - creating!";
          }
        } else if (key == "big" + roleEnums.DEFENDER) {
          if (value < managerCreep.MAX_BIG_DEFENDER * bigRatio &&
            roleDefender.createCreep(
              spawn, true)) {
            ret = "Not Enough Big Defender - creating!";
          }
        }
      }
      // peace
      else {
        if (key == roleEnums.DEFENDER) {
          if (value < managerCreep.MAX_DEFENDER * managerCreep.PEACE_RATIO &&
            roleDefender.createCreep(
              spawn, false)) {
            ret = "Not Enough Defender - creating!";
          }
        } else if (key == "big" + roleEnums.DEFENDER) {
          if (value < managerCreep.MAX_BIG_DEFENDER * managerCreep.PEACE_RATIO &&
            roleDefender.createCreep(
              spawn, true)) {
            ret = "Not Enough Big Defender - creating!";
          }
        } else if (key == roleEnums.HARVESTER) {
          if (value < managerCreep.MAX_HARVESTER * smallRatio &&
            roleHarvester.createCreep(
              spawn, false)) {
            ret = "Not Enough Harvester - creating!";
          }
        } else if (key == "big" + roleEnums.HARVESTER) {
          if (value < managerCreep.MAX_BIG_HARVESTER * bigRatio &&
            roleHarvester.createCreep(
              spawn, true)) {
            ret = "Not Enough Big Harvester - creating!";
          }
        } else if (key == roleEnums.GATHERER) {
          if (value < managerCreep.MAX_GATHERER * smallRatio &&
            roleGatherer.createCreep(
              spawn, false)) {
            ret = "Not Enough Gatherer - creating!";
          }
        } else if (key == roleEnums.IR_HARVESTER && !Memory[spawn.room +
            ":defend"]) {
          value += creeps.get("big" + roleEnums.IR_HARVESTER);
          if (value < managerCreep.MAX_IR_HARVESTER) {
            if (roleIrHarvester.createCreep(
                spawn, true)) {
              ret = "Not Enough IR Harvester - big creating!";
            } else if (roleIrHarvester.createCreep(
                spawn, false)) {
              ret = "Not Enough IR Harvester - creating!";
            }
          }
        } else if (key == roleEnums.SCOUT && !Memory[spawn.room +
            ":defend"]) {
          value += creeps.get("big" + roleEnums.SCOUT);
          if (value < managerCreep.MAX_SCOUT) {
            if (roleScout.createCreep(
                spawn, true)) {
              ret = "Not Enough Scouts - big creating!";
            } else if (roleScout.createCreep(
                spawn, false)) {
              ret = "Not Enough Scouts - creating!";
            }
          }
        } else if (key == roleEnums.RAIDER) {
          value += creeps.get("big" + roleEnums.RAIDER);
          if (value < managerCreep.MAX_RAIDER) {
            if (roleRaider.createCreep(
                spawn, true)) {
              ret = "Not Enough Raider - big creating!";
            } else if (roleRaider.createCreep(
                spawn, false)) {
              ret = "Not Enough Raider - creating!";
            }
          }
        } else if (key == "big" + roleEnums.GATHERER) {
          if (value < managerCreep.MAX_BIG_GATHERER * bigRatio &&
            roleGatherer.createCreep(
              spawn, true)) {
            ret = "Not Enough Gatherer - creating!";
          }
        } else if (key ==
          roleEnums.BUILDER) {
          if (value < managerCreep.MAX_BUILDER * smallRatio &&
            roleBuilder.createCreep(
              spawn, false)) {
            ret = "Not Enough Builder - creating!";
          }
        } else if (key == "big" + roleEnums.BUILDER) {
          if (value < managerCreep.MAX_BIG_BUILDER * bigRatio &&
            roleBuilder.createCreep(
              spawn, true)) {
            ret = "Not Enough Big Builder - creating!";
          }
        } else if (key == roleEnums.UPGRADER) {
          if (value < managerCreep.MAX_UPGRADER * smallRatio &&
            roleUpgrader.createCreep(
              spawn, false)) {
            ret = "Not Enough Upgrader - creating!";
          }
        } else if (key == "big" + roleEnums.UPGRADER) {
          if (value < managerCreep.MAX_BIG_UPGRADER * bigRatio &&
            roleUpgrader.createCreep(
              spawn, true)) {
            ret = "Not Enough Big Upgrader - creating!";
          }
        }
      }
      if (ret != null) {
        console.log(ret);
        return;
      }
    });
  },
  action: function() {
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
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
      if (creep.memory.role == roleEnums.DEFENDER) {
        roleDefender.run(creep);
      }
      if (creep.memory.role == roleEnums.IR_HARVESTER) {
        roleIrHarvester.run(creep);
      }
      if (creep.memory.role == roleEnums.SCOUT) {
        roleScout.run(creep);
      }
      if (creep.memory.role == roleEnums.RAIDER) {
        roleRaider.run(creep);
      }
    }
  },
  deleteMemory: function() {
    if (Game.time % 250 == 0) {
      // clear flags
      Object.keys(Memory).forEach(function(key, value) {
          var deleteKey;
          var found = false;
          if (key.match("Flag")) {
            for (var name in Game.flags) {
              var flag = Game.flags[name];
              if (key.match(flag.name)) {
                found = true;
              }
            }
            if (!found) {
              delete Memory[key];
            }
          }
        })
        // clear dead creeps
      for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
          if (Memory.creeps[i].safeToDelete) {
            delete Memory.creeps[i];
          } else {
            Memory.creeps[i].safeToDelete = true;
          }
        }
      }
    }
  }


};

module.exports = managerCreep;
