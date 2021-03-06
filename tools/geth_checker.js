'use strict';

const getConfigStrategyPath = function(argv) {
  const defaultConfigStrategyPath = rootPrefix + '/tools/config_strategy.json',
    passedStrategyPath = argv && argv[2], //Config Strategy path as argument.
    configStrategyPath = passedStrategyPath || defaultConfigStrategyPath;
  return configStrategyPath;
};

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  fs = require('fs'),
  configStrategyPath = getConfigStrategyPath(process.argv),
  configStrategy = require(configStrategyPath),
  ic = new InstanceComposer(configStrategy);

require(rootPrefix + '/lib/web3/providers/factory');

const performer = async function() {
  const web3ProviderFactory = ic.getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('ws');

  const delay = 10 * 1000,
    timeoutValue = 30 * 60 * 1000;

  var counter = 0,
    totalTime = counter * delay,
    isInProcess = false;

  setInterval(function() {
    if (totalTime <= timeoutValue) {
      if (isInProcess == false) {
        isInProcess = true;
        web3Provider.eth.getBlockNumber(function(err, blocknumber) {
          if (err || blocknumber < 1) {
            logger.debug('Unable to get blocknumber');
          } else {
            logger.debug('blocknumber', blocknumber);
            process.exit(0);
          }
          isInProcess = false;
        });
      }
    } else {
      logger.error('GethChecker unable to complete process in time: ', timeoutValue);
      process.exit(1);
    }
    counter++;
    totalTime = counter * delay;
  }, delay);
};

performer();
