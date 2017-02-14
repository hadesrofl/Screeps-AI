var globals = {
  creepSize: {
    small: 1,
    big: 2,
    large: 3,
    huge: 4
  },
  transferRestricts: {
    energyAmount: 40,
    energyRatio: 0.7,
    roomCapacity: 300
  },
  wallHealth: {
    ratio: 0.0010,
    lowest: 5000
  },
  safeModeRatio: 0.6,
  lowestRoadHealth: 5000,
  rampartHealthRatio: 0.2,
  evolutionEnergyCap: {
    small: 500,
    big: 750
  },
  PREFIX: {
    MEM_FLAG: "Flag Safe: ",
    MEM_US_TIME: "Flag Last Safe: ",
    MEM_ALLOC: "Allocated to Flag: ",
    MEM_SOURCES: "Sources in Flag Room: "
  },
  FLAG_RECHECK_TIME: 200
};

module.exports = globals;
