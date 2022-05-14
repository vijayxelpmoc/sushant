import { Module } from '@nestjs/common';

import { UtilityService } from './utility.service';
import { UtilityController } from './utility.controller';
import { HttpModule } from '@nestjs/axios';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { SfModule } from '@gowebknot/palette-salesforce-service';

@Module({
  imports: [
    SfModule,
    HttpModule,
    MailerModule.forRoot({
      transport: {
        // Through Etheral
        // host: 'smtp.ethereal.email',
        // port: 587,
        // logger: true,
        // debug: true,
        // secureConnection: false,
        // auth: {
        //   user: 'kendall91@ethereal.email',
        //   pass: 'wq4wsGbt2dhFgjrpHk',
        // },

        // Through Gmail services (remember to disbale secure apps in settings)
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        service: 'gmail',
        auth: {
          user: 'noreplypaletteapp@gmail.com',
          pass: 'paletteemailservice',
        },
      },
      template: {
        dir: process.cwd() + '/src/common/mailer/template/',
        adapter: new HandlebarsAdapter(), // or new PugAdapter()
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}
