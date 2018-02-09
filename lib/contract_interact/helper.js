"use strict";

/**
 * This is utility class for contract interacts<br><br>
 *
 * Ref: {@link module:ContractHelper}
 *
 * @module lib/contract_helper/helper
 */

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , web3EventsDecoder = require(rootPrefix+'/lib/web3/events/decoder')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/rpc')
  , BigNumber = require('bignumber.js')
  ;

/**
 * Deploy Helper class to perform deploy
 *
 * @exports lib/contract_helper/helper
 */
const helper = {

  /**
   * Call methods (execute methods which DO NOT modify state of contracts)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [options] - optional params
   * @param {Object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {Promise}
   *
   */
  call: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params,options)
    }
    return web3RpcProvider.eth.call(params)
      .then(function(response){
        //logger.info(response);
        if ( transactionOutputs ) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);  
        } else {
          return response;
        }
      });
  },

  /**
   * get outputs of a given transaction
   *
   * @param {Object} transactionObject - transactionObject is returned from call method.
   *
   * @return {Object}
   *
   */
  getTransactionOutputs: function ( transactionObject ) {
    return transactionObject._method.outputs;
  },

  /**
   * @ignore
   */
  sendTxAsync: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions) {
    const senderAddr = coreAddresses.getAddressForUser(senderName)
          ,senderPassphrase = coreAddresses.getPassphraseForUser(senderName)
    ;

    return helper.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions);
  },

  /**
   * @ignore
   */
  sendTxAsyncFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions) { 
    const txParams = {
      from: senderAddr,
      to: currContractAddr,
      data: encodeABI
    };
    Object.assign(txParams, txOptions);

    logger.info("sendTxAsyncFromAddr :: Unlock Account", senderAddr);
    return web3RpcProvider.eth.personal.unlockAccount( senderAddr, senderPassphrase)
      .then( _ => {
        var isPromiseSettled = false;
        logger.info("sendTxAsyncFromAddr :: Unlocked" ,senderAddr );
        return new Promise(async function (onResolve, onReject) { 
          try {
            web3RpcProvider.eth.sendTransaction(txParams ,function (error, result) {
              //THIS CALLBACK IS IMPORTANT -> on('error') Does not explain the reason.

              // logger.info("sendTransaction :: callback :: error", error);
              // logger.info("sendTransaction :: callback :: result", result);
              if ( error ) {
                logger.info("sendTxAsyncFromAddr :: sendTransaction :: error :: \n\t", error );
                !isPromiseSettled && onReject( error );
              }
            })
              .on('transactionHash', txHash => {
                logger.info("sendTxAsyncFromAddr :: sendTransaction :: transactionHash :: txHash ", txHash);
                isPromiseSettled = true;
                onResolve( txHash );
              });
          } catch( ex ) {
            logger.info("sendTxAsyncFromAddr :: sendTransaction :: Exception :: \n\t", JSON.stringify( ex ) );
            onReject( ex );
          }
        });
      })
      .catch( reason => {

        logger.info("sendTxAsyncFromAddr :: catch :: \n\t", reason, "\n\t", JSON.stringify( reason ) );
        return Promise.reject( reason );
      });
  },

  /**
   * Safe Send a transaction (this internally waits for transaction to be mined)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {String} senderName - name of transaction's sender
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [txOptions] - optional txOptions
   * @param {Object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {Promise}
   *
   */
  safeSend: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions, addressToNameMap) {
    return helper.sendTxAsync(web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions)
    .then(function(transactionHash) {
        return helper.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap)
        .then(function(txReceipt) {
          if (txReceipt.gasUsed == txOptions.gasPrice) {
            logger.error("safeSend used complete gas gasPrice : " + txOptions.gasPrice);
          }
          return Promise.resolve(txReceipt);
        });
      }
    );
  },

  /**
   * Get Transaction Receipt
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @params {String} {transactionHash} - Transaction Hash
   * @param {Object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {Promise}
   *
   */
  getTxReceipt: function(web3RpcProvider, transactionHash, addressToNameMap) {
    return new Promise (function(onResolve, onReject) {

      var tryReceipt = function() {
        setTimeout( function(){
            web3RpcProvider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
          },
          5000
        );
      };

      var handleResponse = function (response) {
        if (response) {
          const web3EventsDecoderResult = web3EventsDecoder.perform(response, addressToNameMap);
          onResolve(web3EventsDecoderResult);
        } else {
          logger.info('Waiting for ' + transactionHash + ' to be mined');
          tryReceipt();
        }
      };

      tryReceipt();

    });
  },

  /**
   * Validate Price value
   *
   * @param {Integer} price - Fixed point integer value
   *
   * @return {Promise}
   *
   */
  validatePrice: function(price){
    var priceBigNum = new BigNumber(price);

    if (priceBigNum.isInt() === false) {
      logger.error("Price should be fixed point integer not floating point number");
      Promise.reject("Price should be fixed point integer not floating point number");
    }

    if (priceBigNum.equals(0)) {
      logger.error("Zero Price is not allowed");
      Promise.reject("Zero Price is not allowed");
    }
  },

  /**
   * * @return {BigNumer} 10^18
   */
  decimalPrecisionInWei: function(){
    return web3RpcProvider.utils.toWei("1", "ether");
  }

};

module.exports = helper;