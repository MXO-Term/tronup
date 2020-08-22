(function() {
	'use strict';

	const ABI = [{"constant":true,"inputs":[],"name":"contractInfo","outputs":[{"name":"_invested","type":"uint256"},{"name":"_withdrawn","type":"uint256"},{"name":"_direct_bonus","type":"uint256"},{"name":"_match_bonus","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"userInfo","outputs":[{"name":"for_withdraw","type":"uint256"},{"name":"total_invested","type":"uint256"},{"name":"total_withdrawn","type":"uint256"},{"name":"total_match_bonus","type":"uint256"},{"name":"structure","type":"uint256[3]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_tarif","type":"uint8"},{"name":"_upline","type":"address"}],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];

    let contract = null;

    let VueTRON = {
        data() {
            return {
                tron: {	
                    tronWeb: false,
                    auth: false,
                    account: ''
                }
            };
        },
        created() {
            let self = this,
                tries = 0;

            setTimeout(function initTimer() {
                if(!window.tronWeb) return ++tries < 50 ? setTimeout(initTimer, 100) : null;

                self.tron.tronWeb = !!window.tronWeb;

                window.tronWeb.on('addressChanged', function() {
                    self.tron.account = window.tronWeb.defaultAddress.base58;
                });

                setTimeout(function chechAuth() {
                    self.tron.auth = window.tronWeb && window.tronWeb.ready;
                    if(!self.tron.auth) setTimeout(chechAuth, 200);
                    else self.tron.account = window.tronWeb.defaultAddress.base58;
                }, 200);
            }, 100);
        },
        methods: {
            getTronWeb() {
                return new Promise((resolve, reject) => {
                    window.tronWeb ? resolve(window.tronWeb) : reject('TronWeb not found');
                });
            }
        }
    };

	window.App = new Vue({
  		mixins: [VueTRON],
		el: '#App',
		data: {
            upline: 'TYfZSxZJ6YNTMekRKYhbSimaXvVXPQQiNr', // T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb - Zero address
            contract_address: 'TPvzfh8wfZx6E21oWawcxgwj9Qz1B3eGKk',
            contract: {
                invested: 0,
                withdraw: 0,
                direct_bonus: 0,
                match_bonus: 0
            },
            user: {
            	trx: 0,
                for_withdraw: 0,
                total_invested: 0,
                total_withdrawn: 0,
                total_match_bonus: 0,
                structure: [0,0,0]
            },
            tarifs: [
            	{days: 5, percent: 140},
            	{days: 6, percent: 150},
            	{days: 7, percent: 160},
            	{days: 8, percent: 170},
            	{days: 9, percent: 180},
            	{days: 10, percent: 190},
            	{days: 11, percent: 200},
            	{days: 12, percent: 210},
            	{days: 13, percent: 220},
            	{days: 14, percent: 230},
            	{days: 15, percent: 240},
            ],
            calc: {
            	tarif: 0,
            	amount: 50
            },
            events: []
		},
		mounted() {
            let m = location.search.match(/ref=(T[1-9A-HJ-NP-Za-km-z]{33})/i);
            if(m) {
            	this.upline = m[1];
            	document.cookie = "upline=" + this.upline + "; path=/; expires=" + (new Date(new Date().getTime() + 86400 * 365 * 1000)).toUTCString();
            }

            m = document.cookie.match(/upline=(T[1-9A-HJ-NP-Za-km-z]{33})/i);
            if(m) this.upline = m[1];

		    if(!document.cookie.match(/coopolice=1/)) {
		    	this.notice('This website uses cookies for functionality, analytics and advertising purposes as described in our Privacy Policy. If you agree to our use of cookies, please continue to use our site.', '007eff', 0).then(() => (document.cookie = 'coopolice=1; Max-Age=31536000; path=/'));
		    }

            setInterval(() => {
                this.getContractInfo();
                this.getUserInfo();
            }, 3000);
		},
        watch: {
            'tron.account'() {
                this.getTronWeb().then(tronWeb => {
                    contract = tronWeb.contract(ABI, tronWeb.address.toHex(this.contract_address));

                    this.getContractInfo();
                    this.getEventsList();
                    this.getUserInfo();
                });
            }
        },
		methods: {
            // colors: primary = 007eff; success = 4caf50; warning = fb8c00; error = e53935
            notice(msg, color = '007eff', time = 3000) {
                return new Promise((resolve, reject) => {
                    let wrap = $('<div style="position:fixed; left:calc(50% - 150px); box-shadow:0 5px 25px rgba(0,0,0,0.2); width:320px; top:40px; background:#' + (color ? color : '007eff') + '; border-radius:10px; color:#fff; padding:20px 20px; font:14px/1.2 Tahoma, sans-serif; cursor:pointer; z-index:999999; text-align:center;">' + msg + '</div>')
                        .on('click', () => { wrap.remove(); resolve(); })
                        .appendTo('body');
                    if(time) setTimeout(() => { wrap.remove(); }, time);
                });
            },
            copyText(value) {
                let s = document.createElement('input');
                s.value = value;
                document.body.appendChild(s);

                if(navigator.userAgent.match(/ipad|ipod|iphone/i)) {
                    s.contentEditable = true;
                    s.readOnly = false;
                    let range = document.createRange();
                    range.selectNodeContents(s);
                    let sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    s.setSelectionRange(0, 999999);
                }
                else s.select();

                try { document.execCommand('copy'); this.notice('Link copied to clipboard', '4caf50'); }
                catch (err) { }

                s.remove();
            },
            getContractInfo() {
                this.getTronWeb().then(tronWeb => {
                    if(contract) {
                        contract.contractInfo().call().then(res => {
                        	this.contract.invested = parseFloat(tronWeb.fromSun(res._invested));
                        	this.contract.withdraw = parseFloat(tronWeb.fromSun(res._withdrawn));
                            this.contract.direct_bonus = parseFloat(tronWeb.fromSun(res._direct_bonus));
                        	this.contract.match_bonus = parseFloat(tronWeb.fromSun(res._match_bonus));
                        });
                    }
                });
            },
            getUserInfo() {
                this.getTronWeb().then(tronWeb => {
                    tronWeb.trx.getBalance(this.tron.account).then(res => {
                        this.user.trx = parseFloat(tronWeb.fromSun(res));
                    });

                    if(contract) {
                        contract.userInfo(this.tron.account).call().then(res => {
                            this.user.for_withdraw = parseFloat(tronWeb.fromSun(res.for_withdraw));
                            this.user.total_invested = parseFloat(tronWeb.fromSun(res.total_invested));
                            this.user.total_withdrawn = parseFloat(tronWeb.fromSun(res.total_withdrawn));
                            this.user.total_match_bonus = parseFloat(tronWeb.fromSun(res.total_match_bonus));
                            this.user.structure = res.structure;
                        });
                    }
                });
            },
            getEventsList() {
            	fetch('https://api.trongrid.io/v1/contracts/' + this.contract_address + '/events?event_name=&only_confirmed=true&order_by=block_timestamp%2Cdesc').then(r => r.json()).then(res => {
            		res.data.forEach(v => {
            			this.events.push({
            				time: v.block_timestamp,
            				type: v.event_name,
            				amount: (v.result.amount / 1e6) || 0,
            				tx: v.transaction_id
            			});
            		});
            	});
            },
            deposit(tarif, amount) {
                amount = parseFloat(amount) || 0;
                if(amount >= 50) {
                    this.getTronWeb().then(tronWeb => {
                        this.notice('Confirm transaction', 'fb8c00');
                        contract.deposit(tarif, this.upline).send({
                            callValue: tronWeb.toSun(amount),
                            shouldPollResponse: true
                        }).then(res => {
                            this.getUserInfo();
                            this.notice('Transaction successful', '4caf50');
                        });
                    });
                }
            },
            withdraw() {
                this.getTronWeb().then(tronWeb => {
                    this.notice('Confirm transaction', 'fb8c00');
                    contract.withdraw().send({shouldPollResponse: true}).then(res => {
                        this.getUserInfo();
                        this.notice('Transaction successful', '4caf50');
                    });
                });
            }
		}
	});
})();