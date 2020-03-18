const accountRole = {
        "AUCTIONEER": 'auctioneer',
        "USER": ''
    },

// ""Database"" of user of DApp
user = {
    // Must be set an address that is Auctioneer
    "0x95bBE15a2A4448095aC7595D2c793796508E373D": {
        "address": "0x95bBE15a2A4448095aC7595D2c793796508E373D",
        "name": "Auctioneer",
        "role": accountRole.AUCTIONEER,
        "last_access": 0,
    },
},

App = {
    loading: false,
    contracts: {},
    currentPage: "void",

    load: async () => {
        await App.loadWeb3()
        console.log("web3 - ok")
        await App.loadAccount()
        console.log("loadAccount - ok")
        await App.loadContract()
        console.log("loadContract - ok")
        await App.listenForEvents()
        console.log("listener  - ok")

        await App.changePage({
            'name': "home"
        })
    },

    // Load and set a provider for browser (Metamask only)
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum)
            try {
                // Request account access if needed
                await ethereum.enable()
                // Acccounts now exposed
                web3.eth.sendTransaction({
                    /* ... */
                })
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // Acccounts always exposed
            web3.eth.sendTransaction({
                /* ... */
            })
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    // Set the current blockchain account
    loadAccount: async () => {
        App.activeAccount = user[web3.eth.accounts[0]]
        console.log("Loaded Acc: " + App.activeAccount + "  " + web3.eth.accounts[0])
    },

    // Create a JavaScript version of the smart contract
    loadContract: async () => {

        const AuctionHouse = await $.getJSON('AuctionHouse.json')
        App.contracts.AuctionHouse = TruffleContract(AuctionHouse)
        App.contracts.AuctionHouse.setProvider(App.web3Provider)

        const Linear = await $.getJSON('Linear.json')
        App.contracts.Linear = TruffleContract(Linear)
        App.contracts.Linear.setProvider(App.web3Provider)

        const Sup_linear = await $.getJSON('Sup_linear.json')
        App.contracts.Sup_linear = TruffleContract(Sup_linear)
        App.contracts.Sup_linear.setProvider(App.web3Provider)

        const Dutch = await $.getJSON('Dutch.json')
        App.contracts.Dutch = TruffleContract(Dutch)
        App.contracts.Dutch.setProvider(App.web3Provider)

        const Vickrey = await $.getJSON('Vickrey.json')
        App.contracts.Vickrey = TruffleContract(Vickrey)
        App.contracts.Vickrey.setProvider(App.web3Provider)

        App.AuctionHouse = await App.contracts.AuctionHouse.deployed()
        App.Linear = await App.contracts.Linear.deployed()
        App.Sup_linear = await App.contracts.Sup_linear.deployed()
    },

    //Set all listener events issued by all contracts
    listenForEvents: async () => {

        if (App.activeAccount != undefined) {
            // New contracts created by the auction house
            App.contracts.AuctionHouse.deployed().then(function (instance) {
                instance.newAuction({}, {
                    fromBlock: App.activeAccount["last_access"] || 0
                }).watch(function (error, event) {
                    App.showToast({
                        title: "New " + event.args.auction_type + " Auction",
                        from: "Ethereum Blockchain",
                        text: "Seller: <small>" + event.args.seller + "</small><br>Description: " + event.args.description,
                    })
                    console.log("event triggered", event);
                    App.activeAccount.last_access = event.blockNumber
                })
            })

            let auctions_addresses = await App.getAllAuction()
            // Listener for all events issued by all auctions
            auctions_addresses.forEach(async (element) => {
                link = `onclick="App.changePage({name: 'see_auction', data: {address: '${element}'}})"`
                toast = {from: "Ethereum Blockchain", link: link}

                App.contracts.Dutch.at(element).allEvents({
                    fromBlock: App.activeAccount["last_access"] || 0
                }, async (error, event) => {
                    add = event.address
                    toast["title"] = event.event
                    toast["text"] = "Auction: <small>"+add+"</small><br>"
                    switch (event.event) {
                        case "start_auction":
                            toast["text"] += "Seller: <small>"+ event.args.seller+"</small>"
                            break;
                        case "end_auction":
                            toast["text"] += "Winner: <small>"+ event.args.winner+"</small>"
                            break;
                    } 
                    App.showToast(toast)
                    console.log("event", event);
                    App.activeAccount.last_access = event.blockNumber
                })

                //Only Vickrey auction status changes
                App.contracts.Vickrey.at(element).then(async (instance) => {
                    _type = await instance.auction_type.call()

                    if (_type == "Vickrey") {
                        await instance.new_phase_withdrawal({}, {
                            fromBlock: App.activeAccount["last_access"] || 0
                        }).watch(function (error, event) {
                            App.showToast({
                                title: "New Phase Withdrawal",
                                from: "Ethereum Blockchain",
                                text: "Seller: <small>" + event.args.seller + "</small><br>Description: " + event.args.description,
                                link: link
                            })
                            console.log("event triggered", event);
                            App.activeAccount.last_access = event.blockNumber
                        })
                        await instance.new_phase_opening({}, {
                            fromBlock: App.activeAccount["last_access"] || 0
                        }).watch(function (error, event) {
                            App.showToast({
                                title: "New Phase Opening",
                                from: "Ethereum Blockchain",
                                text: "Seller: <small>" + event.args.seller + "</small><br>Description: " + event.args.description,
                                link: link
                            })
                            console.log("event triggered", event);
                            App.activeAccount.last_access = event.blockNumber
                        })
                    }
                })
            })
        }
    },

    changePage: async (page) => {
        App.currentPage = page

        //Checking if the user has not changed during page changes
        temp_address = web3.eth.accounts[0]
        temp_user = user[temp_address]
        if (App.activeAccount == undefined && temp_user == undefined)
            App.currentPage.name = "register"
        else {
            if (App.activeAccount.address != temp_address && temp_user == undefined)
                App.currentPage.name = "register"
            else
                App.activeAccount = temp_user
        }

        $("#accountAddress").html(App.activeAccount == undefined ? "0x0..0" : App.activeAccount.address)
        $("#account").text(App.activeAccount == undefined ? "" : App.activeAccount.name)

        // home - register - my_auctions - auctions_done - new_auction - see_auction
        all_pages = {
            "home": "All Auction",
            "register": "Registration",
            "auction_done": "All Auctions Done",
            "new_auction": "Create New Auctions",
            "my_auction": "All Auctions Created By Me"
        }
        $('#title').html(all_pages[page.name] || "$=$ Some Error Occurred")

        //I load the content of the page and if needed enter useful parameters
        $('#content').load("content/" + page.name + ".html", function () {

            switch (page.name) {
                case "home":
                    render_table()
                    break;
                case "register":
                    $('#user_address').val(temp_address)
                    break;
                case "new_auction":
                    $('#select_form').val(page.data)
                    if (page.data == "Vickrey") {
                        $('#Dutch_form').hide()
                        $('#Vickrey_form').show()
                    } else {
                        $('#Dutch_form').show()
                        $('#Vickrey_form').hide()
                    }
                    render_option()
                    break;
                case "see_auction":
                    $('#title').html("Auction "+page.data.address)
                    render_see_auction(page.data)
                    break;
                case "my_auction":
                    render_table()
                    break;
                default:
                    break;
            }
        });
        console.log("New Page: " + page.name)
    },

    //-----------------Utility function for pages---------

    // I register the user in my "DB"
    userRegistration: () => {
        temp = web3.eth.accounts[0]

        //I add to the object that makes me BD
        user[temp] = {
            "address": temp,
            "name": $('#user_name').val(),
            "role": accountRole.USER,
            "last_access": 0,
        }
        App.activeAccount = user[temp]
        web3.eth.getBlock('latest', (e, block) => {
            App.activeAccount.last_access = block.number
            user[temp] = block.number   
            App.listenForEvents()
        })
    },

    showToast: (_event) => {
        time = new Date().getTime()
        li = _event.link || ""
        from = _event.from || "Blockchiain"
        $("#add_toast").append(`
            <div id="${time}" ${li} class="toast" style="width: 350px;" role="alert" aria-live="assertive" aria-atomic="true" data-animation="true" data-autohide="true" data-delay="5000">
                <div class="toast-header">
                    <strong class="mr-auto" id="titleEvent">${_event.title}</strong>
                    <small class="text-muted">from ${from} just now</small>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="toast-body" id="textEvent">
                    ${_event.text}
                </div>
            </div>
        `);

        $("#" + time).toast("show")
        setInterval(() => {
            $("#" + time).remove();
        }, 10000);
    },

    //I'll take all the addresses of the auctions that were created through the auction house 
    getAllAuction: async () => {
        let auctions_addresses = []
        await App.contracts.AuctionHouse.deployed().then(async (instance) => {
            size_auctions = await instance.n_auction.call()
            size_auctions = size_auctions.toNumber()
        }).then(async () => {
            for (var i = 0; i < size_auctions; i++) {
                await App.contracts.AuctionHouse.deployed().then(async (instance) => {
                    let tmp = await instance.auctions_addresses.call(i)
                    auctions_addresses.push(tmp)
                })
            }
        });
        return auctions_addresses
    },
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})