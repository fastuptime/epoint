const axios = require('axios');
const crypto = require('crypto');

class Epoint {
    constructor(data = {}) {

        this.epoint_transaction = data.epoint_transaction || null;

        this.order_id = data.order_id || null;

        this.card_uid = data.card_uid || null;

        this.private_key = data.private_key || null;

        this.public_key = data.public_key || null;

        this.amount = data.amount || null;

        this.currency = data.currency || 'AZN';

        this.language = data.language || 'az';

        this.description = data.description || null;

        this.success_redirect_url = data.success_redirect_url || null;

        this.error_redirect_url = data.error_redirect_url || null;

        this.signature = data.signature || null;
        this.data = data.data || null;

        this.languages = ['az', 'en', 'ru'];
        this.response = null;
    }

    sign(jsonData) {
        this.data = Buffer.from(JSON.stringify(jsonData)).toString('base64');
        const signatureString = `${this.private_key}${this.data}${this.private_key}`;
        this.signature = Buffer.from(crypto.createHash('sha1').update(signatureString, 'utf8').digest()).toString('base64');
        return this;
    }

    createSignatureByData() {
        const signatureString = `${this.private_key}${this.data}${this.private_key}`;
        return Buffer.from(crypto.createHash('sha1').update(signatureString, 'utf8').digest()).toString('base64');
    }

    isSignatureValid() {
        return this.signature === this.createSignatureByData();
    }

    getDataAsJson() {
        return Buffer.from(this.data, 'base64').toString('utf8');
    }

    getDataAsObject() {
        return JSON.parse(Buffer.from(this.data, 'base64').toString('utf8'));
    }

    async generatePaymentUrlWithTypingCard() {
        const jsonData = {
            'public_key': this.public_key,
            'language': this.language,
            'amount': this.amount,
            'currency': this.currency,
            'order_id': this.order_id,
            'description': this.description,
            'success_redirect_url': this.success_redirect_url,
            'error_redirect_url': this.error_redirect_url
        };

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/request', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    async getStatus() {
        const jsonData = {
            'public_key': this.public_key
        };

        if (this.order_id) {
            jsonData['order_id'] = this.order_id;
        }

        if (this.epoint_transaction) {
            jsonData['transaction'] = this.epoint_transaction;
        }

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/get-status', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    async registerCardForPayment() {
        const jsonData = {
            'public_key': this.public_key,
            'language': this.language,
            'refund': 0,
            'description': this.description,
            'success_redirect_url': this.success_redirect_url,
            'error_redirect_url': this.error_redirect_url
        };

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/card-registration', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    async registerCardForRefund() {
        const jsonData = {
            'public_key': this.public_key,
            'language': this.language,
            'refund': 1,
            'description': this.description,
            'success_redirect_url': this.success_redirect_url,
            'error_redirect_url': this.error_redirect_url
        };

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/card-registration', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    async payWithSavedCard() {
        const jsonData = {
            'public_key': this.public_key,
            'language': this.language,
            'card_uid': this.card_uid,
            'order_id': this.order_id,
            'amount': this.amount,
            'description': this.description,
            'currency': this.currency
        };

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/execute-pay', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    async cancelPayment() {
        const jsonData = {
            'public_key': this.public_key,
            'language': this.language,
            'transaction': this.epoint_transaction,
            'currency': this.currency
        };

        if (this.amount) {
            jsonData['amount'] = this.amount;
        }

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/reverse', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    async refundPayment() {
        const jsonData = {
            'public_key': this.public_key,
            'language': this.language,
            'card_uid': this.card_uid,
            'order_id': this.order_id,
            'amount': this.amount,
            'currency': this.currency,
            'description': this.description
        };

        this.sign(jsonData);

        const response = await axios.post('https://epoint.az/api/1/refund-request', new URLSearchParams({
            'data': this.data,
            'signature': this.signature
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.response = response.data;
        return this;
    }

    static instantiate(privateKey, publicKey) {
        return new Epoint({
            "private_key": privateKey,
            "public_key": publicKey
        });
    }

    static async checkPayment(privateKey, publicKey, uid, epointTransaction = false) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        if (epointTransaction) {
            epoint.epoint_transaction = uid;
        } else {
            epoint.order_id = uid;
        }

        await epoint.getStatus();
        return epoint.response;
    }

    static async typeCard(privateKey, publicKey, orderId, amount, description, successRedirectUrl = null, errorRedirectUrl = null) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        epoint.order_id = orderId;
        epoint.amount = amount;
        epoint.description = description;

        if (successRedirectUrl) {
            epoint.success_redirect_url = successRedirectUrl;
        }

        if (errorRedirectUrl) {
            epoint.error_redirect_url = errorRedirectUrl;
        }

        await epoint.generatePaymentUrlWithTypingCard();
        return epoint.response;
    }

    static async saveCardForPayment(privateKey, publicKey, description, successRedirectUrl = null, errorRedirectUrl = null) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        epoint.description = description;

        if (successRedirectUrl) {
            epoint.success_redirect_url = successRedirectUrl;
        }

        if (errorRedirectUrl) {
            epoint.error_redirect_url = errorRedirectUrl;
        }

        await epoint.registerCardForPayment();
        return epoint.response;
    }

    static async saveCardForRefund(privateKey, publicKey, description, successRedirectUrl = null, errorRedirectUrl = null) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        epoint.description = description;

        if (successRedirectUrl) {
            epoint.success_redirect_url = successRedirectUrl;
        }

        if (errorRedirectUrl) {
            epoint.error_redirect_url = errorRedirectUrl;
        }

        await epoint.registerCardForRefund();
        return epoint.response;
    }

    static async payWithSaved(privateKey, publicKey, cardUid, orderId, amount, description) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        epoint.card_uid = cardUid;
        epoint.order_id = orderId;
        epoint.amount = amount;
        epoint.description = description;

        await epoint.payWithSavedCard();
        return epoint.response;
    }

    static async cancel(privateKey, publicKey, epointTransaction, amount = null) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        epoint.epoint_transaction = epointTransaction;

        if (amount) {
            epoint.amount = amount;
        }

        await epoint.cancelPayment();
        return epoint.response;
    }

    static async refund(privateKey, publicKey, cardUid, orderId, amount, description) {
        const epoint = Epoint.instantiate(privateKey, publicKey);

        epoint.card_uid = cardUid;
        epoint.order_id = orderId;
        epoint.amount = amount;
        epoint.description = description;

        await epoint.refundPayment();
        return epoint.response;
    }

    static validateCallback(privateKey, data, signature) {
        const epoint = new Epoint({
            "private_key": privateKey,
            "data": data,
            "signature": signature
        });

        return epoint.isSignatureValid();
    }
}

module.exports = Epoint;
