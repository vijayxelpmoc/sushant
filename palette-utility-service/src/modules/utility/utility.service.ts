import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  SfService,
  Notifier,
  NotificationType,
  NotificationTypeEmail,
} from '@gowebknot/palette-wrapper';

import { Errors, Responses } from '@src/constants';
import { ContactInfoDto, FeedbackInfoDto, ReportIssueDto } from './dto';
import { SFGuide } from './types';

@Injectable()
export class UtilityService {
  _notifier: Notifier;
  constructor(private sfService: SfService) {
    this._notifier = new Notifier();
  }

  async contactUs(contactInfoDto: ContactInfoDto) {
    const { email, message, name } = contactInfoDto;

    const response = await this.sfService.generics.contacts.create({
      User_Name__c: name,
      Message__c: message,
      Email__c: email,
    });

    if (response.success) {
      // Send a notification to the admin
      // All the recipients of contactUs are stored in env:UTILITY_NOTIFICATION_RECIPIENTS

      const body = `
      A new contact form was submitted on Palette app at ${new Date()}. </br>
      Name: ${name} </br>
      Email: <a href="mailto:${email}">${email} </br>
      Message: ${message} </br>`;

      const config: NotificationTypeEmail = {
        to: process.env.UTILITY_NOTIFICATION_RECIPIENTS.split(','),
        subject: '[NEW] Contact Form Response from Palette',
        body,
      };

      this._notifier.send(NotificationType.EMAIL, config);

      return {
        statusCode: 200,
        message: Responses.CONTACT_US_SUCCESS,
      };
    }

    throw new InternalServerErrorException(Errors.CONTACT_US_FAILED);
  }

  async addReportIssue(reportIssueDto: ReportIssueDto) {
    const { email, message, name, screenshots } = reportIssueDto;

    const response = await this.sfService.models.reportIssues.create({
      User_Name__c: name,
      Email__c: email,
      Message__c: message,
      Screenshot1__c: screenshots[0],
      Screenshot2__c: screenshots[1],
      Screenshot3__c: screenshots[2],
    });

    if (response.success) {
      // Send a notification to the admin
      // All the recipients of report issue are stored in env:UTILITY_NOTIFICATION_RECIPIENTS

      const body = `
      A new issue was report on Palette app at ${new Date()}. </br> 
      Name: ${name} </br>
      Email: <a href="mailto:${email}">${email} </br>
      Message: ${message} </br>
      
      Reference Screenshots : </br>
      ${screenshots.map(
        (screenshot, idx) => `<a href="${screenshot}">Image ${idx + 1}</a>`,
      )}`;

      const config: NotificationTypeEmail = {
        to: process.env.UTILITY_NOTIFICATION_RECIPIENTS.split(','),
        subject: '[NEW] Issue Reported from Palette',
        body,
      };

      this._notifier.send(NotificationType.EMAIL, config);

      return {
        statusCode: 200,
        message: Responses.REPORT_ISSUE_SUCCESS,
      };
    }

    throw new InternalServerErrorException(Errors.REPORT_ISSUE_FAILED);
  }

  async addFeedback(feedbackInfoDto: FeedbackInfoDto) {
    const { email, feedback, name, rating } = feedbackInfoDto;

    const response = await this.sfService.models.feedbacks.create({
      User_Name__c: name,
      Email__c: email,
      feedback__c: feedback,
      Rating__c: rating,
    });

    if (response.success) {
      // Send a notification to the admin
      // All the recipients of feedback are stored in env:UTILITY_NOTIFICATION_RECIPIENTS

      const body = `
      A new feedback was submitted on Palette app at ${new Date()}. </br>
      Name: ${name} </br>
      Email: <a href="mailto:${email}">${email} </br>
      Feedback: ${feedback} </br>
      Rating: ${rating} </br>`;

      const config: NotificationTypeEmail = {
        to: process.env.UTILITY_NOTIFICATION_RECIPIENTS.split(','),
        subject: '[New] Feedback Response from Palette',
        body,
      };

      this._notifier.send(NotificationType.EMAIL, config);

      return {
        statusCode: 200,
        message: Responses.FEEDBACK_SUCCESS,
      };
    }

    throw new InternalServerErrorException(Errors.FEEDBACK_SUBMIT_FAILED);
  }

  async getGuides(role: string) {
    const guides: SFGuide[] = await this.sfService.models.guides.get(
      'Name, Guide_Description__c, Event_String__c, Role__c',
      {},
    );

    if (!guides) {
      throw new NotFoundException(Errors.GUIDES_NOT_FOUND);
    }

    guides
      .filter((guide) => guide.Role__c.split(';').includes(role))
      .map((guide) => ({
        name: guide.Name,
        description: guide.Guide_Description__c,
        eventString: guide.Event_String__c,
      }));

    return {
      statusCode: 200,
      message: Responses.GUIDES_SUCCESS,
      data: guides,
    };
  }
}
