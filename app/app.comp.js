(function () {
    'use strict';
    var module = angular.module('app', ['ngMaterial'])
        .component('appComponent', {
            templateUrl: 'app/app.html',
            controller: ['$http', controller],
            controllerAs: 'model'
        })

    function controller($http) {
        var model = this;
        model.numOfCurrencies = 10;
        model.cryptoArray = [];
        model.userName = 'tyler-fletcher';
        model.spacer = "spacerShow";
        model.tableContainer = "tableContainer";
        model.dataButton = "dataButtonNoSpacer";

        model.getSteemPerMvest = function (username, numOfCurrencies) {
            // Reset Array If Running Again
            model.cryptoArray = [];
            model.hasData = true;
            model.spacer = "spacerHide";
            model.tableContainer = "tableContainerNoSpacer";
            model.usernameContainer = "usernameContainerNoSpacer";
            model.cryptoContainer = "cryptoContainerNoSpacer";

            // Move table below user info for easier readablility 
            if (numOfCurrencies > 15) {
                $(".tableDiv").css("display", "table");
                $(".tableDiv").css("margin-top", "15px");

            } else {
                $(".tableDiv").css("display", "inline-table");
                $(".tableDiv").css("margin-top", "0px");
            }

            steem.api.getDynamicGlobalProperties(function (err, result) {

                // Get Total Vesting Fund Steem As A Number
                var total_vesting_fund_steem = result.total_vesting_fund_steem;
                total_vesting_fund_steem = Number(total_vesting_fund_steem.substring(0, total_vesting_fund_steem.length - 6));

                // Get Total Vesting Shares As A Number
                var total_vesting_shares = result.total_vesting_shares;
                total_vesting_shares = Number(total_vesting_shares.substring(0, total_vesting_shares.length - 6));

                // Calculate Current Steem/MVest
                var steem_per_mvest = (total_vesting_fund_steem / (total_vesting_shares / 1000000)).toFixed(3);
                var url = "https://api.coinmarketcap.com/v1/ticker/steem/";

                getSteemPrice(handleSteemPrice, url, steem_per_mvest, username, numOfCurrencies);

            });
        }


        function getSteemPrice(callback, endpoint, steem_per_mvest, username, numOfCurrencies) {
            var price = null;
            $http({
                method: 'GET',
                url: endpoint
            }).then(function successCallback(response) {
                callback(steem_per_mvest, username, numOfCurrencies, response.data[0].price_usd);
            });
            return price;
        }

        function handleSteemPrice(steem_per_mvest, username, numOfCurrencies, steem_usd) {
            var url = "https://api.coinmarketcap.com/v1/ticker/steem-dollars/";
            getSBDPrice(handleSBDPrice, url, steem_per_mvest, username, numOfCurrencies, steem_usd);
        }

        function getSBDPrice(callback, endpoint, steem_per_mvest, username, numOfCurrencies, steem_usd) {
            var price = null;
            $http({
                method: 'GET',
                url: endpoint
            }).then(function successCallback(response) {
                callback(steem_per_mvest, username, numOfCurrencies, steem_usd, response.data[0].price_usd);
            });
            return price;
        }

        function handleSBDPrice(steem_per_mvest, username, numOfCurrencies, steem_usd, sbd_usd) {
            getAccount(steem_per_mvest, username, numOfCurrencies, steem_usd, sbd_usd);
        }

        // Function to get Account Data, Using Current Steem/MVest
        function getAccount(steemPerMVest, username, numOfCurrencies, steem_usd, sbd_usd) {
            steem.api.getAccounts([username], function (err, result) {
                handleUserData(result, steemPerMVest, numOfCurrencies, steem_usd, sbd_usd);
            });
        }

        // Data handler
        function handleUserData(account, steemPerMVest, numOfCurrencies, steem_usd, sbd_usd) {
            // Only Searching One Account, Get The Vesting Shares
            // And Convert To Number
            var vest = account[0].vesting_shares;
            vest = Number(vest.substring(0, vest.length - 6));

            // Calculate Steem Power
            var SP = ((vest * steemPerMVest) / 1000000).toFixed(3);

            var steem_bal = account[0].balance;
            var steem = Number(steem_bal.substring(0, steem_bal.length - 6));

            var url = 'https://api.coinmarketcap.com/v1/ticker/?limit=' + numOfCurrencies;
            var sbd_bal = account[0].sbd_balance;
            var SBD = Number(sbd_bal.substring(0, sbd_bal.length - 4));
            model.name = account[0].name;
            console.log(account);
            // Pass Current Steem Power Into CMC Comparison Function
            getCoinMarketCap(url, SP, steem, SBD, steem_usd, sbd_usd);

        };

        // CMC Comparison Function
        function getCoinMarketCap(endpoint, SP, steem, SBD, steem_usd, sbd_usd) {
            // Request top 10 Cryptocurrencies
            // Simple GET request example:
            $http({
                method: 'GET',
                url: endpoint
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                handleCryptoObject(response.data, SP, steem, SBD, steem_usd, sbd_usd);
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                console.log(response);
            });
        }

        // Get CMC JSON and Parse Into JSON Object
        function handleCryptoObject(result, SP, steem, SBD, steem_usd, sbd_usd) {
            var jsonObject = result;
            model.total_sp = SP;
            model.total_steem = steem;
            model.total_sbd = SBD;
            var steem_index;
            model.steem_price = steem_usd;
            model.sbd_price = sbd_usd;

            console.log(SBD);

            // Get Index Of Steem
            for (var i = 0; i < jsonObject.length; i++) {
                if (jsonObject[i].name == "Steem") {
                    steem_index = i;
                }
            }
            model.sp_worth = (model.total_sp * steem_usd);
            model.steem_worth = (model.total_steem * steem_usd);
            model.sbd_worth = (model.total_sbd * sbd_usd);
            model.total_worth = (model.sp_worth + model.steem_worth + model.sbd_worth);

            // Push Each Crypto to The CryptoArray
            for (var i = 0; i < jsonObject.length; i++) {
                var cryptoObject = {};
                cryptoObject.name = jsonObject[i].name;
                cryptoObject.rank = jsonObject[i].rank;
                cryptoObject.price_usd = jsonObject[i].price_usd;
                cryptoObject.price_btc = jsonObject[i].price_btc;
                cryptoObject.symbol = jsonObject[i].symbol;
                cryptoObject.compared_worth = (model.total_worth / cryptoObject.price_usd);
                model.cryptoArray.push(cryptoObject);
            }
        }
    }
}());
