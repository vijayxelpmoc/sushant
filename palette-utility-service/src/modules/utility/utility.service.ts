import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Notifier,
  NotificationType,
  NotificationTypeEmail,
} from '@gowebknot/palette-wrapper';

import { Errors, Responses } from '@src/constants';
import { ContactInfoDto, FeedbackInfoDto, ReportIssueDto } from './dto';
import { SFGuide } from './types';
import { SfService } from '@gowebknot/palette-salesforce-service';

@Injectable()
export class UtilityService {
  _notifier: Notifier;
  constructor(private sfService: SfService) {
    this._notifier = new Notifier();
  }

  async contactUs(contactInfoDto: ContactInfoDto, instituteId: string) {
    const { email, message, name } = contactInfoDto;

    const response = await this.sfService.models.contactUs.create(
      {
        User_Name: name,
        Message: message,
        Email: email,
      },
      instituteId,
    );

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

  async addReportIssue(reportIssueDto: ReportIssueDto, instituteId: string) {
    const { email, message, name, screenshots } = reportIssueDto;

    const response = await this.sfService.models.reportIssues.create(
      {
        User_Name: name,
        Email: email,
        Message: message,
        Screenshot1: screenshots[0],
        Screenshot2: screenshots[1],
        Screenshot3: screenshots[2],
      },
      instituteId,
    );

    console.log(response);
    

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

  async addFeedback(feedbackInfoDto: FeedbackInfoDto, instituteId: string) {
    const { email, feedback, name, rating } = feedbackInfoDto;

    const response = await this.sfService.models.feedback.create(
      {
        User_Name: name,
        Email: email,
        feedback: feedback,
        Rating: rating,
      },
      instituteId,
    );

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

  async getGuides(role: string, instituteId: string) {
    const guides: SFGuide[] = await this.sfService.models.guides.get(
      'Name, Guide_Description, Event_String, Role',
      {},
      {},
      instituteId,
    );

    console.log(guides);

    if (!guides) {
      throw new NotFoundException(Errors.GUIDES_NOT_FOUND);
    }

    guides
      .filter((guide) => guide.Role.split(';').includes(role))
      .map((guide) => ({
        name: guide.Name,
        description: guide.Guide_Description,
        eventString: guide.Event_String,
      }));

    return {
      statusCode: 200,
      message: Responses.GUIDES_SUCCESS,
      data: guides,
    };
  }
}
