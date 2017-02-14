var roleEnums = require('role.enums');
var globals = require('globals');
var creepUtils = require('utils.creep');

const FLAG_REGEX = /raid/;

var roleRaider = {
  parts: [ATTACK, TOUGH, MOVE, MOVE],
  bigParts: [RANGED_ATTACK, ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, MOVE, MOVE,
    MOVE, MOVE,
    MOVE],

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
          role: roleEnums.RAIDER,
          flag: 0,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.RAIDER,
          flag: 0,
          big: false
        });
      }
      return true;
    }
    return false;
  },
  /** @param {Creep} creep **/
  suicide: function(creep) {
    var moveCounter = 0;
    var attackCounter = 0;
    for (let i = 0; i < creep.body.length; i++) {
      var bodyPart = creep.body[i];
      if (bodyPart.hits > 0) {
        if (bodyPart.type == MOVE) {
          moveCounter++;
        } else if (bodyPart.type == ATTACK) {
          attackCounter++;
        }
      }
    }
    if (moveCounter == 0 || attackCounter == 0) {
      console.log("RAIDER: Move: " + moveCounter + ";ATTACK: " +
        attackCounter + " => Killing myself");
      creep.suicide();
    }
  },
  goHome: function(creep) {
    var spawn = Game.rooms[creep.memory.home].find(FIND_MY_SPAWNS)[0];
    creepUtils.moveTo(creep, spawn, false);
    if (creep.memory.flag != 0) {
      creep.memory.flag = 0;
    }
  },
  /** @param {Creep} creep **/
  checkRoom: function(creep) {
    if (creep.room.name != creep.memory.home) {
      var spawns = creep.room.find(
        FIND_HOSTILE_SPAWNS);
      if (spawns.length) {
        var spawn = spawns[0];
        if (creep.attack(spawn) == ERR_NOT_IN_RANGE) {
          if (creepUtils.moveTo(creep, spawn, false) == ERR_NO_PATH) {
            var enemy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
              filter: (c) => {
                return c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(
                  RANGED_ATTACK);
              }
            });
            if (enemy) {
              if (creep.attack(enemy) == ERR_NOT_IN_RANGE) {
                creepUtils.moveTo(creep, enemy, false);
              }
            } else {
              var tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                  return (structure.structureType == STRUCTURE_TOWER);
                }
              });
              if (tower) {
                if (creep.attack(tower) == ERR_NOT_IN_RANGE) {
                  creepUtils.moveTo(creep, tower, false);
                }
              } else {
                var rampart = creep.pos.findClosestByPath(
                  FIND_STRUCTURES, {
                    filter: (s) => {
                      return s.structureType == STRUCTURE_RAMPART;
                    }
                  });
                if (rampart) {
                  if (creep.attack(rampart) == ERR_NOT_IN_RANGE) {
                    creepUtils.moveTo(creep, rampart, false);
                  }
                } else {
                  var wall = creep.pos.findClosestByPath(
                    FIND_STRUCTURES, {
                      filter: (s) => {
                        return s.structureType ==
                          STRUCTURE_WALL;
                      }
                    });
                  if (wall) {
                    if (creep.attack(wall) == ERR_NOT_IN_RANGE) {
                      creepUtils.moveTo(creep, wall, false);
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        this.goHome(creep);
      }
    }
  },
  initalizeFlags: function() {
    for (var name in Game.flags) {
      var flag = Game.flags[name];
      if (FLAG_REGEX.test(flag.name)) {
        if (Memory[globals.PREFIX.MEM_ALLOC + flag.name] == undefined) {
          Memory[globals.PREFIX.MEM_ALLOC + flag.name] = 0;
        }
      }
    }
  },
  /** @param {Creep} creep **/
  init: function(creep) {
    if (creep.memory.flag == undefined) {
      creep.memory.flag = 0;
    }
    if (creep.memory.home == undefined) {
      creep.memory.home = creep.room.name;
    }
    this.initalizeFlags();
  },
  /** @param {Creep} creep **/
  getColdestFlag: function(creep) {
    var flagMap = this.updateFlags();
    var minCount = -1;

    flagMap.forEach(function(value, key) {
      if (key !== 0) {
        if (minCount == -1) {
          minCount = value;
          flag = key;
        }
        if (value < minCount) {
          minCount = value;
          flag = key;
        }
      }
    });
    if (minCount >= 0) {
      return flag;
    } else {
      return -1;
    }
  },
  updateFlags: function() {
    var flagMap = new Map();
    for (var name in Game.flags) {
      var flag = Game.flags[name];
      if (FLAG_REGEX.test(flag.name)) {
        flagMap.set(flag.name, 0);
      }
    }
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if (creep.memory.role == roleEnums.RAIDER) {
        if (flagMap.has(creep.memory.flag)) {
          flagMap.set(creep.memory.flag, flagMap.get(creep.memory.flag) +
            1);
          Memory[globals.PREFIX.MEM_ALLOC + creep.memory.flag] =
            flagMap.get(
              creep.memory.flag);
        }
      }
    }
    return flagMap;
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    // set home
    this.init(creep);
    this.updateFlags();
    if (creep.memory.flag == 0) {
      var flag = this.getColdestFlag(creep);
      if (!(flag < 0)) {
        creep.memory.flag = flag;
      } else {
        creep.memory.flag = 'home';
      }
    }
    if (creep.memory.flag == 'home') {
      this.goHome(creep);
    } else {
      if (creep.room.name != creep.memory.home) {
        var flags = creep.room.find(FIND_FLAGS);
        var found = false;
        for (var name in flags) {
          var flag = flags[name];
          if (flag.name == creep.memory.flag) {
            found = true;
            this.checkRoom(creep);
            /**var inRange = creep.pos.findInRange(FIND_FLAGS, 2, {
              filter: (f) => {
                return f.name == creep.memory.flag;
              }
            });
            if (!inRange.length) {
              creepUtils.moveTo(creep, flag, false);
            }**/
          }
        }
        if (!found) {
          creepUtils.moveTo(creep, Game.flags[creep.memory.flag], false);
        }
      } else {
        creepUtils.moveTo(creep, Game.flags[creep.memory.flag], false);
      }
    }
  }
};

module.exports = roleRaider;
