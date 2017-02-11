var allocationMap = new Map();
var sourceMap = new Map();
var managerHarvest = {


  /** @param {Creep} creep **/
  getColdestSource: function(creep) {
    var minCount = -1;
    var source = "";
    var sources = creep.room.find(FIND_SOURCES);
    var creeps = creep.room.find(FIND_MY_CREEPS);
    for (let i = 0; i < sources.length; i++) {
      sourceMap.set(sources[i].id, 0);
    }

    for (let i = 0; i < creeps.length; i++) {
      var creep = creeps[i];
      if (creep.memory.sourceId != undefined) {
        for (let j = 0; j < sources.length; j++) {
          if (creep.memory.sourceId == sources[j].id) {
            if (sourceMap.has(sources[j].id)) {
              sourceMap.set(sources[j].id, sourceMap.get(sources[j].id) +
                1);
            }
          }
        }
      }
    }
    sourceMap.forEach(function(value, key) {
      if (key !== 0) {
        if (minCount == -1) {
          minCount = value;
          source = key;
        }
        if (value < minCount) {
          minCount = value;
          source = key;
        }
      }
    });
    if (minCount >= 0) {
      return source;
    } else {
      return -1;
    }
  },
  getSources: function() {
    return sourceMap;
  }
};

module.exports = managerHarvest;
