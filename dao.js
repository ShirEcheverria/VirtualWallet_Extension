/**
 * Data Access Object (DAO) for wallet operations.
 * Encapsulates storage logic and history tracking for BTC and ETH.
 *
 * @namespace dao
 */

const dao = {

    // Add a given amount to the selected currency (BTC or ETH)
    /**
     * Adds a specified amount to the selected cryptocurrency.
     * @param {string} symbol - The currency symbol ("BTC", "ETH").
     * @param {number} amount - The amount to add.
     */
    add(symbol, amount) {
        let current = Number(localStorage.getItem(symbol) || 0);
        current += Number(amount);
        localStorage.setItem(symbol, current);
        // Log simple and full history
        dao._addHistory(`Added ${amount} ${symbol}`);
        dao._addFullHistory(symbol, amount, current);
    },

    /**
     * Removes a specified amount from the selected cryptocurrency.
     * Ensures the final value is not negative.
     * @param {string} symbol - The currency symbol ( "BTC", "ETH").
     * @param {number} amount - The amount to remove.
     */
    remove(symbol, amount) {
        let current = Number(localStorage.getItem(symbol) || 0);
        current -= Number(amount);
        if (current < 0) current = 0;
        localStorage.setItem(symbol, current);
        
        // Record the transaction in both user-facing and detailed logs
        dao._addHistory(`Removed ${amount} ${symbol}`);
        dao._addFullHistory(symbol, -amount, current);
    },

    /**
     * Returns all non-zero balances as an object.
     * @returns {Object} An object like { BTC: number, ETH: number }.
     */
    total() {
        const coins = ['BTC', 'ETH'];
        const wallet = {};
        for (let coin of coins) {
            let amount = Number(localStorage.getItem(coin) || 0);
            if (amount > 0) wallet[coin] = amount;
        }
        return wallet;
    },

    /**
     * Returns the transaction history log as an array of strings.
     * @returns {string[]} List of human-readable transactions.
     */
    getHistory() {
        return JSON.parse(localStorage.getItem("history") || "[]");
    },


    /**
     * Deletes a single entry from the visible transaction history.
     * @param {number} index - The index of the history entry to remove.
     */
    clearHistoryItem(index) {
        const history = dao.getHistory();
        history.splice(index, 1);
        localStorage.setItem("history", JSON.stringify(history));
    },

    /**
     * Adds a text-based log to the short transaction history.
     * @private
     * @param {string} text - Description of the transaction.
     */
    _addHistory(text) {
        const history = dao.getHistory();
        const now = new Date().toLocaleString();
        history.unshift(`${text} on ${now}`);
        localStorage.setItem("history", JSON.stringify(history));
    },

    /**
     * Adds a detailed transaction log used for charts and audit.
     * @private
     * @param {string} symbol - The cryptocurrency used.
     * @param {number} amount - The transaction amount (+/-).
     * @param {number} total - The total balance after transaction.
     */

    _addFullHistory(symbol, amount, total) {
        const fullHistory = JSON.parse(localStorage.getItem("transactionHistoryFull") || "[]");
        const now = new Date().toLocaleString();
        fullHistory.push({ currency: symbol, amount: amount, total: total, date: now });
        localStorage.setItem("transactionHistoryFull", JSON.stringify(fullHistory));
    }
};
