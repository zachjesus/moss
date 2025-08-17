<img width="3307" height="2338" alt="moss_diagram_draft2-1" src="https://github.com/user-attachments/assets/048aff4e-352e-4379-a991-b7cb71031575" />

# How to use

Make sure you have the hyper ledger fabric pre-reqs. https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html

Make sure you also have the test-network-k8s pre-reqs as well. https://github.com/hyperledger/fabric-samples/tree/main/test-network-k8s
This project will only work using the kind and docker config described in the above pre-reqs.

To run a basic test run these commands:

_kind export kubeconfig_

_./network rest-easy_

_kubectl get pods -n test-network_

File names must follow the format ISBN_# , OCLC_# , LCCN_# , OLID_# by default. Format is set in the two util.ts files (which must match) 
_kubectl cp {epub or pdf} test-network/{asset-encrypter-id-from-get-pods}:/assets/_    <---- This will automatically encrypt the uploaded epub or pdf and send it to the LCP server
                                                                                           Plus it will then send a post to the fabric rest api to add the book to the ledger.
                                                                                           Metadata is automatically handled by your pre-config

_curl -s --header "X-Api-Key:${SAMPLE_APIKEY}" http://fabric-rest-sample.localho.st/api/assets_ <--- You should see your uploaded book in the ledger (but it may take a sec)

# To Do
- [ ] Sync ledger commands return, lend delete to the LCP server and PV
- [ ] Set up proper auth for API/Ledger/K8S
- [ ] Allow for easy multi-org networks 
