// Copyright 2017 OST.com Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Test: PriceOracle_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils           = require('../../lib/utils.js'),
      BigNumber       = require('bignumber.js'),
      PriceOracle     = artifacts.require('./PriceOracle.sol'),
      PriceOracleMock = artifacts.require('./PriceOracleMock.sol');

const baseCurrency  = 'OST',
      quoteCurrency = 'USD';

/// @dev Export common requires
module.exports.utils = Utils;
module.exports.bigNumber = BigNumber;

/// @dev Deploy PriceOracle
module.exports.deployPriceOracle = async function(artifacts, accounts){
  const priceOracle = await PriceOracle.new(baseCurrency, quoteCurrency),
        opsAddress  = accounts[1];

  assert.ok(await priceOracle.setOpsAddress(opsAddress));

  return {
    priceOracle : priceOracle
  }
};

/// @dev Deploy PriceOracleMock
module.exports.deployPriceOracleMock = async function(artifacts, accounts){
  const priceOracle = await PriceOracleMock.new(baseCurrency, quoteCurrency),
  		  opsAddress 	= accounts[1];

  assert.ok(await priceOracle.setOpsAddress(opsAddress));

  return {
    priceOracle : priceOracle
  }
};
