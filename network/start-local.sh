#!/bin/bash
export TEST_NETWORK_FABRIC_VERSION=3.1
export TEST_NETWORK_ORDERER_TYPE=bft

./network kind
./network cluster init

./network up

./network channel create

./network chaincode deploy asset-transfer-basic ../asset-transfer-basic/chaincode-typescript

./network chaincode invoke asset-transfer-basic '{"Args":["InitLedger"]}'

#./network chaincode query  asset-transfer-basic '{"Args":["ReadAsset","asset1"]}'
