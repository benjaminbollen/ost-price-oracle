'use strict';

/**
 * This is script for deploying PriceOracle contract on any chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Deployer Address</li>
 *     </ol>
 *
 *   These are the following steps:<br>
 *     <ol>
 *       <li>Deploy PriceOracle contract</li>
 *       <li>Constructor expects base Currency and quote Currency as argument</li>
 *       <li>Set Ops Address of contract to ops key</li>
 *     </ol>
 *
 *
 * @module tools/deploy/price_oracle
 */

const getConfigStrategyPath = function(argv) {
  const defaultConfigStrategyPath = rootPrefix + '/tools/config_strategy.json',
    passedStrategyPath = argv && argv[7], //Config Strategy path as argument.
    configStrategyPath = passedStrategyPath || defaultConfigStrategyPath;
  return configStrategyPath;
};

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  populateEnvVars = require(rootPrefix + '/test/scripts/populate_vars'),
  fs = require('fs'),
  Path = require('path'),
  configStrategyPath = getConfigStrategyPath(process.argv),
  configStrategy = require(configStrategyPath),
  ic = new InstanceComposer(configStrategy);

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/tools/deploy/deploy_and_set_ops');

// Different addresses used for deployment
const deployerName = 'deployer',
  coreAddresses = ic.getCoreAddresses(),
  deployerAddress = coreAddresses.getAddressForUser(deployerName),
  opsName = 'ops',
  opsAdress = coreAddresses.getAddressForUser(opsName);

/**
 * Validation Method
 *
 * @param {Array} arguments
 */
const validate = function(argv) {
  if (argv[2] === undefined || argv[2] == '' || argv[3] === undefined || argv[3] == '') {
    logger.error('Mandatory Parameters baseCurrency/quoteCurrency are missing!');
    process.exit(0);
  }

  if (argv[4] === undefined || argv[4] == '') {
    logger.error('Gas Price is mandatory!');
    process.exit(0);
  }
};

/**
 * Validation Method
 *
 * @param {Bool} is_travis_ci_enabled - Run Travis CI or not
 * @param {String} baseCurrency - Base Currency
 * @param {String} quoteCurrency - Quote Currency
 * @param {Hex} contractAddress - contract Address
 *
 * @return {}
 */
const handleTravis = function(is_travis_ci_enabled, baseCurrency, quoteCurrency, contractAddress) {
  if (is_travis_ci_enabled === true) {
    var ost_price_oracle = '{"' + baseCurrency + '":{"' + quoteCurrency + '":"' + contractAddress + '"}}';
    populateEnvVars.renderAndPopulate('ost_utility_price_oracles', {
      ost_utility_price_oracles: ost_price_oracle
    });
  }
};

/**
 * Write contract address to file based on parameter
 *
 * @param {String} fileName - file name
 * @param {Hex} contractAddress - contract Address
 *
 * @return {}
 */
const writeContractAddressToFile = function(fileName, contractAddress) {
  // Write contract address to file
  if (fileName != '') {
    fs.writeFileSync(Path.join(__dirname, '/' + fileName), contractAddress);
  }
};

/**
 * It is the main performer method of this deployment script
 *
 * @param {Array} argv - arguments
 * @param {String} argv[2] - Base Currency
 * @param {String} argv[3] - Quote Currency
 * @param {Hex} argv[4] - gas Price
 * @param {String} argv[5] - If Travis CI to run
 * @param {String} argv[6] - File name where contract address needs to write
 *
 *
 * @return {}
 */
const performer = async function(argv) {
  validate(argv);

  const baseCurrency = argv[2].trim(),
    quoteCurrency = argv[3].trim(),
    gasPrice = argv[4].trim(),
    is_travis_ci_enabled = argv[5] === 'travis',
    fileForContractAddress = argv[6] != undefined ? argv[6].trim() : '',
    coreConstants = ic.getCoreConstants(),
    DeployAndSetOpsKlass = ic.getDeploySetOpsKlass();
  // Contract deployment options for value chain
  const deploymentOptions = {
    gas: coreConstants.OST_UTILITY_GAS_LIMIT,
    gasPrice: gasPrice
  };

  logger.debug('Base Currency: ' + baseCurrency);
  logger.debug('Quote Currency: ' + quoteCurrency);
  logger.debug('gas Price: ' + gasPrice);
  logger.debug('Travis CI enabled Status: ' + is_travis_ci_enabled);
  logger.debug('Deployer Address: ' + deployerAddress);
  logger.debug('Ops Address: ' + opsAdress);
  logger.debug('file to write For ContractAddress: ' + fileForContractAddress);

  var deployObj = new DeployAndSetOpsKlass(),
    response = await deployObj.perform({
      gasPrice: gasPrice,
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency
    });

  const contractAddress = response.contractAddress;

  handleTravis(is_travis_ci_enabled, baseCurrency, quoteCurrency, contractAddress);
  writeContractAddressToFile(fileForContractAddress, contractAddress);
  process.exit(0);
};

// node tools/deploy/price_oracle.js OST USD 0x12A05F200 '' a.txt
performer(process.argv);
