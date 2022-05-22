import * as AWS from 'aws-sdk';

const SES = new AWS.SES();


exports.handler = async event => {
    try {
        console.log('event', event);
    } catch (err) {
        console.log('error', err);
    }
}