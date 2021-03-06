/**
 * Index File of ost-price-oracle node module
 */

"use strict";

const rootPrefix        = "."
    , version           = require(rootPrefix + '/package.json').version
    , InstanceComposer  = require(rootPrefix + "/instance_composer")
  ;
require(rootPrefix + '/lib/contract_interact/price_oracle');
require(rootPrefix + '/tools/deploy/deploy_and_set_ops');

const OSTPriceOracle = function ( configStrategy ) {
  const oThis = this;

  if ( !configStrategy ) {
    throw "Mandatory argument configStrategy missing";
  }

  const instanceComposer = new InstanceComposer( configStrategy );

  oThis.ic = function () {
    return instanceComposer;
  };

  oThis.priceOracle = instanceComposer.getPriceOracle();
  oThis.deployAndSetOps = instanceComposer.getDeploySetOpsKlass();
};

OSTPriceOracle.prototype = {
  version: version
};

module.exports = OSTPriceOracle;