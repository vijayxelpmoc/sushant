import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import Handlebars from 'handlebars';
import * as AWS from 'aws-sdk';
import { env } from 'process';
import fs from 'fs';
import path from 'path';

import { EmailTemplates, NotificationTypeEmail } from '@src/types';
import { logger } from '@src/logger';

export class EmailNotifier {
  private _transporter: Transporter;
  private _templateDir = path.join(__dirname, '../data/templates');

  constructor() {
    this._transporter = nodemailer.createTransport({
<<<<<<< HEAD
      // ses: new AWS.SES(),
=======
      host: env.MAILER_HOST,
      port: Number(env.MAILER_PORT) || 587,
      secure: false,
      auth: {
        user: env.MAILER_AUTH_USER,
        pass: env.MAILER_AUTH_PASS,
      },
      debug: true,
>>>>>>> 0a0fba169b48031ade6351fc7856184f0fde1041
    });
    // this._transporter = nodemailer.createTransport({
    //   ses: new AWS.SES(),
    // });
  }

  _mapTemplateToSource(template: EmailTemplates) {
    switch (template) {
      case EmailTemplates.PASSWORD_RESET:
        return 'password-reset.hbs';
      default:
        throw new Error(`Template ${template} is not supported`);
    }
  }

  _getTemplate(source: string) {
    return fs.readFileSync(path.join(this._templateDir, source), 'utf-8');
  }

  async send(data: NotificationTypeEmail) {
    const {
      to,
      subject,
      coupled = false,
      useTemplate = false,
      body,
      templateAttrs,
    } = data;

    logger.info(`Received new email request, data: ${data}`);

    const mailOptions: SendMailOptions = {
      from: `<Palette> ${env.MAILER_AUTH_USER}`,
      to:
        Array.isArray(to) && !coupled
          ? to.join(', ')
          : Array.isArray(to)
          ? to[0]
          : to,
      subject,
      text: body || '',
    };
    if (Array.isArray(to) && coupled) {
      mailOptions.bcc = to.slice(1).join(', ');
    }
    if (useTemplate) {
      const template = Handlebars.compile(
        this._getTemplate(this._mapTemplateToSource(templateAttrs.template)),
      );
      mailOptions.html = template(templateAttrs.context);
    }

    logger.info('Preparing to send email');
    return await this._transporter.sendMail(mailOptions, (err, result) => {
      if (err) {
        logger.warn(`Error sending email, ${err}`);
      }
      logger.info(`Mailer Result: ${result}`);
    });
  }
}
