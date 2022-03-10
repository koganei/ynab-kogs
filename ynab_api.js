const {HttpLib} = require('./HttpLib');

class YnabApi {

    async connect(preferences) {
        global.log('============ connecting to YNAB API ===========');
        this.preferences = preferences;

        const res = await HttpLib.Instance.LoadJsonAsync('https://api.youneedabudget.com/v1/budgets', null, {
            Authorization: 'Bearer ' + preferences.apiKey
        });
        return res.Data.data.budgets;
    }

    async getAlerts() {
        try {
            const res = await HttpLib.Instance.LoadJsonAsync(`https://api.youneedabudget.com/v1/budgets/${this.preferences.budgetKey}/transactions`, {
                type: 'unapproved'
            }, {
                Authorization: 'Bearer ' + this.preferences.apiKey
            });
            return {
                unapproved: res.Data.data.transactions
            }
        } catch(e) {
            global.logError('Could not fetch alerts', e);
        }
        
    }
}