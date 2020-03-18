const AuctionHouse = artifacts.require("AuctionHouse");
const Linear = artifacts.require("Linear");
const Sup_linear = artifacts.require("Sup_linear");
const Dutch = artifacts.require("Dutch");
const Vickrey = artifacts.require("Vickrey");


module.exports = function(deployer) {
  deployer.deploy(AuctionHouse);
  deployer.deploy(Linear);
  deployer.deploy(Sup_linear);
  // we don't need because of Factory pattern (see SmartAuction repo)
  // deployer.deploy(dutch_auction);
  // deployer.deploy(vickrey_auction);
};
