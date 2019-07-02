const request = require('request-promise');

class GMLS {

    /**
     * Create GMLS
     * @param {object} options Options
     */
    constructor({ Cookie = "" } = {}) {
        if (!(this instanceof GMLS))
            return new GMLS();

        // Counter [ Requests, Bad responses, Request errors, GoogleBOT captcha ]
        this.couonter = [0, 0, 0, 0];
        this.botOldCouneter = 0;

        this.Cookie = Cookie;
    }


    async getData(lang = "en") {
        let res = false;
        let err = false;
        try {
            res = await this.gAPI("/maps/preview/locationsharing/read?authuser=0&hl=" + lang + "&gl=" + lang);
            this.couonter[0]++;
        } catch (e) { err = e}

        if (this.couonter[3] > this.botOldCouneter) {
            this.botOldCouneter = couonter[3];
            // err = true;
        }
        
        if (!res || res.length != 10) {
            this.couonter[1]++;
            err = "Wrong data";
            if (res && res.length == 9)
                err = "Bad Cookies";
        }

        return {
            res,
            err
        };
    }

    async gAPI(method, fq = []) {
        try {
            if (!this.Cookie)
                throw "Need Cookies";

            const url = 'https://www.google.com' + method + (0 <= method.indexOf("?") ? "&" : "?") + "pb=" + fq.join("");
            const res = await request(url, {
                headers: {
                    Cookie: this.Cookie
                }
            });

            let data = JSON.parse(res.replace(")]}'\n", ""));

            return data;
        } catch (err) {
            const {
                statusCode: eCode
            } = err;

            if (eCode == 429) {
                this.couonter[3]++;
                throw "BOT Detected";
            }
            /* else if (eCode == 500) { } */

            await loadCookie();

            this.couonter[2]++;
            throw err;
        }
    }

    /**
     * @param {String} val Cookie
     */
    setCookie (val) {
        this.Cookie = val;
    }
}

module.exports = GMLS;