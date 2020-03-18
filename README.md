# DApp for the SmartAuction on the Ethereum blockchain.
## Final project of Peer to Peer Systems and Blockchains A.A. 2018-19 (UniPi)
The DApp has as back-end the previously developed contracts (see [here](https://github.com/Ruggiero-Santo/SmartAuction)) that manage the auction house and the two types of auction: Dutch and Vikrey; while as front-end a simple web interface that allows you to easily interact with them.\
**ATTENTION**: Before you can launch the DApp, you must retrieve the contracts and the python script from [here](https://github.com/Ruggiero-Santo/SmartAuction) and compile and deploy the contracts on a net with **truffle migrate --reset --network ropsten**, with this you will sent on the *Ropsten* network (with Infura, you must add info in truffle-config.js) you can use a Local network (builded with Ganache)replacing *Ropsten* with *test*. \
You can simply replace the contracts folder and insert the scirpt in the root. If you put the Python script in a different folder you have to change the path in the package.json file (10-11 rows).

## How to run
To use the DApp, you will need to run the **npm run all** command from the project folder, which will start both the web interface and the python script that acts as EAC. In case you want to start the two elements separately you can do it using: for the interface **npm run dev_j** while for the script **npm run dev_p**.

## How to interact with a DApp
You need to install on the browser Metamask that simply manage for you the adress and all transaction on the blockchain.