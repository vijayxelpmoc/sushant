export class NotificationsReminderService {
    constructor() {}

    async sendTodoReminders() {
        try {
            console.log('event', event);
            console.log('cron job working fine');
        } catch (error) {
            console.log('error', error);
        }
    };
} 



// export const sendTodoReminders = async event => {
//     try {
//         console.log('event', event);
//         console.log('cron job working fine');
//     } catch (error) {
//         console.log('error', error);
//     }
// };


// module.exports.sendTodoReminders = (event, context, callback) => {
//     try {
//         console.log('cron job working fine');
//     } catch (error) {
//         console.log('error', error);
//     }
// };