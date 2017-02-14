var creepUtils = {
  /**
  @param {Creep} creep
  @param {boolean} visualize
  **/
  moveTo: function(creep, target, visualize) {
    if (visualize) {
      return creep.moveTo(target, {
        visualizePathStyle: {
          stroke: '#ffffff'
        }
      });
    } else {
      return creep.moveTo(target);
    }
  }
};

module.exports = creepUtils;
