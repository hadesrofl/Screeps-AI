var allocationMap = new Map();
var sourceMap = new Map();
var managerHarvest = {

  /** @param {Creep} creep **/
  isAllocated: function(creep) {
    return allocationMap.has(creep.name);
  },

  /** @param {Creep} creep **/
  addAllocation: function(creep, sourceId) {
    if (this.isAllocated(creep)) {
      console.log(creep.name + " is already allocated to: " + allocationMap
        .get(creep.name));
    } else {
      allocationMap.set(creep.name, sourceId);
      var found = false;
      if (sourceMap.has(sourceId)) {
        var value = sourceMap.get(sourceId);
        value++;
        sourceMap.set(sourceId, value);
      }
    }
  },
  addSource: function(source) {
    if (!sourceMap.has(source.id)) {
      sourceMap.set(source.id, 0);
    }
  },

  getSource: function(creep) {
    if (this.isAllocated(creep)) {
      return allocationMap.get(creep.name);
    } else {
      return -1;
    }
  },
  getColdestSource: function() {
    var minCount = -1;
    var source = "";

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
  },
  clear: function() {
    allocationMap.clear();
    var length = 0;
    sourceMap.forEach(function(value, key) {
      sourceMap.set(key, 0);
      length++;
    });
    console.log("Source Map length: " + length);
  }
};

module.exports = managerHarvest;
