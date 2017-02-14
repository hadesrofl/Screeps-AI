var roleEnums = require('role.enums');
var creepUtils = require('utils.creep');

const exitDistance = 5;
var roleDefender = {
  parts: [ATTACK, ATTACK, TOUGH, TOUGH, MOVE, MOVE],
  bigParts: [RANGED_ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE,
    MOVE, MOVE, MOVE],
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
          role: roleEnums.DEFENDER,
          defendExit: 0,
          arrived: false,
          big: true
        });
      } else {
        spawn.createCreep(this.parts, null, {
          role: roleEnums.DEFENDER,
          defendExit: 0,
          arrived: false,
          big: false
        });
      }
      return true;
    }
    return false;
  },
  /** @param {Creep} creep **/
  suicide: function(creep) {
    var attackCounter = 0;
    var rangedAttackCounter = 0;
    var moveCounter = 0;
    var hasAttack = false;
    var hasRangedAttack = false;
    for (let i = 0; i < creep.body.length; i++) {
      var bodyPart = creep.body[i];
      if (!hasAttack || !hasRangedAttack) {
        if (bodyPart.type == ATTACK) {
          hasAttack = true;
        } else if (bodyPart.type == RANGED_ATTACK) {
          hasRangedAttack = true;
        }
      }
      if (bodyPart.hits > 0) {
        if (bodyPart.type == ATTACK) {
          attackCounter++;
        } else if (bodyPart.type == MOVE) {
          moveCounter++;
        } else if (bodyPart.type == RANGED_ATTACK) {
          rangedAttackCounter++;
        }
      }
    }
    // don't kill if has not melee or ranged attack
    if (!hasAttack) {
      attackCounter++;
    } else if (!hasRangedAttack) {
      rangedAttackCounter++;
    }
    if (attackCounter == 0 || rangedAttackCounter == 0 || moveCounter == 0) {
      console.log("Defender: Move: " + moveCounter + "; Attack: " +
        attackCounter + "; Ranged Attack: " + rangedAttackCounter +
        " => Killing myself");
      creep.suicide();
    }
  },
  /** @param {Creep} creep **/
  defendExit: function(creep) {
    var dir = 0;
    // exit to defend
    if (creep.memory.defendExit != 0) {
      var split = creep.memory.defendExit.split(":");
      if (split[1] == "TOP") {
        dir = FIND_EXIT_TOP;
      } else if (split[1] == "RIGHT") {
        dir = FIND_EXIT_RIGHT;
      } else if (split[1] == "BOTTOM") {
        dir = FIND_EXIT_BOTTOM;
      } else if (split[1] == "LEFT") {
        dir = FIND_EXIT_LEFT;
      }
      var exitsInRange = creep.pos.findInRange(dir, exitDistance);
      if (exitsInRange.length) {
        creep.memory.arrived = true;
        return;
      } else {
        creep.memory.arrived = false;
        creepUtils.moveTo(creep, creep.pos.findClosestByRange(dir),
          false);
      }
    }
    // set new exit
    else {
      var exits = Game.map.describeExits(creep.room.name);
      var directions = new Array(4);
      if (exits != null) {
        var i = 0;
        Object.keys(exits).forEach(function(key, value) {
          directions[i] = key;
          i++;
        });
        var random = Math.floor((Math.random() * directions.length) + 1);
        dir = directions[random];
        var exit;
        if (!creep.memory.arrived && creep.memory.defendExit == 0) {
          if (dir == 1) {
            exit = creep.pos.findClosestByRange(FIND_EXIT_TOP);
            creep.memory.defendExit = creep.room.name + ":" + "TOP";
          } else if (dir == 3) {
            exit = creep.pos.findClosestByRange(FIND_EXIT_RIGHT);
            creep.memory.defendExit = creep.room.name + ":" + "RIGHT";
          } else if (dir == 5) {
            exit = creep.pos.findClosestByRange(FIND_EXIT_BOTTOM);
            creep.memory.defendExit = creep.room.name + ":" + "BOTTOM";
          } else if (dir == 7) {
            exit = creep.pos.findClosestByRange(FIND_EXIT_LEFT);
            creep.memory.defendExit = creep.room.name + ":" + "LEFT";
          }
          if (exit) {
            creep.memory.arrived = false;
            creepUtils.moveTo(creep, exit, false);
          }
        }
      }
    }
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    this.suicide(creep);
    var meleeEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
    var rangedEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
    //melee range?
    if (meleeEnemies.length) {
      var melee = creep.attack(meleeEnemies[0]);
      if (melee == ERR_NO_BODYPART) {
        creep.rangedAttack(meleeEnemies[0]);
      }
    }
    // ranged attack?
    else if (rangedEnemies.length) {
      var ranged = creep.rangedAttack(rangedEnemies[0]);
      // got no ranged attack move to melee range
      if (ranged == ERR_NO_BODYPART) {
        creep.say("DESTROY");
        creepUtils.moveTo(creep, rangedEnemies[0], false);
      }
    }
    // not in sight
    else {
      var enemy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
      if (enemy) {
        creep.say("DESTROY");
        creepUtils.moveTo(creep, enemy, false);
      } else {
        this.defendExit(creep);
      }
    }
  }
};

module.exports = roleDefender;
