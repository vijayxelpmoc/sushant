import {
  BadRequestException,
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
import { ContactInfoDto, FeedbackInfoDto, GetGuidesResponse, GetGuidesSFResponse, ReportIssueDto } from './dto';
import { SFGuide } from './types';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UtilityService {
  _notifier: Notifier;
  constructor(
    private sfService: SfService,
    private mailerService:MailerService,
    private httpService: HttpService,
  ) {
    this._notifier = new Notifier();
  }

  accessToken = `fb3bb87ed25d47fcbba3674a1f75e5194964c66322826ef30c405095134bea57`;
  NewPortalUserUrl = `https://palette-bigthought.ideas.aha.io/api/v1/idea_portals/7065254068546852736/portal_users/?access_token=${this.accessToken}`;
  NewIdeaUrl = `https://palette-bigthought.ideas.aha.io/api/v1/products/6981847117522761702/ideas/?access_token=${this.accessToken}`;

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
    const { email, message, name, type, category, needed_by, screenshots } =
      reportIssueDto;
    // type is a string of categories separrated with commas
    let userId = null;

    const nameArray = name.split(' ');
    const first_name = nameArray[0];
    const last_name = nameArray[1];

    // joining all the urls and making a single string
    // const screenshotsValue = screenshots.join(',\n');

    // saving on salesforce service
    await this.sfService.models.reportIssues.create(
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
    const screenShotList = [];
    for (let i = 0; i < 3; i++) {
      if (screenshots[i]) {
        screenShotList.push(screenshots[i]);
      }
    }
    // send this report as email
    this.sendReportEmail(
      [
        'sumanth.s@gowebknot.com',
        'palette_app@paletteedu.net',
        'ideas-PEW-pallette@iad-prod2.mailer.aha.io',
        // 'kshitijkumar176@gmail.com',
      ],
      name,
      email,
      message,
      screenShotList,
    );

    // Function to create the idea after user creation
    const post_idea = async () => {
      const get_Users = await this.getAllPortalUsers();

      // checking and creating ideea.
      get_Users.subscribe(async (user) => {
        // console.log('get_user', user);

        if (
          user['portal_users'].find((e) => {
            userId = e.id;
            return e.email === email;
          })
        ) {
          try {
            const res = await this.httpService.post(this.NewIdeaUrl, {
              idea: {
                name: 'Bug Report',
                description: message,
                custom_fields: {
                  category, // module
                  needed_by, // needed_by
                  type, // type
                },
                categories: type,
                created_by_portal_user: {
                  id: userId,
                  name,
                },
              },
            });

            res.subscribe((x) => x.data);
            // console.log(res.subscribe(x => x.data));
            return { statusCode: 200, message: 'Added Bug Report' };
          } catch (err) {
            throw new BadRequestException(`Something Went Wrong!`);
          }

          // console.log('Post idea function', user);
        }
      });
    };

    // Function to find/create user
    const create_user = async () => {
      const get_portal_users = await this.getAllPortalUsers();

      // checking and creating users.
      get_portal_users.subscribe(async (x) => {
        // console.log('PORTAL_USERS :', x.portal_users);
        if (
          !x['portal_users'].find((e) => {
            userId = e.id;
            return e.email === email;
          })
        ) {
          try {
            // creating portal user.
            const result = await this.httpService.post(this.NewPortalUserUrl, {
              portal_user: {
                email: email,
                first_name: first_name,
                last_name: last_name,
              },
            });
            result
              .pipe(map((x) => x.data))
              .subscribe((x) => console.log('result', x));
          } catch (err) {
            throw new BadRequestException(`Something Went Wrong!`);
          }
        }
      });
    };

    // call post idea after we found the user or created the user
    create_user();
    setTimeout(() => {
      post_idea();
    }, 10000);

    // create_user().then(post_idea);

    return { statusCode: 200, message: 'User Added' };
  }

  async getAllPortalUsers(): Promise<any> {
    // console.log('GetAllPortalUsers');

    const resp = this.httpService
      .get(this.NewPortalUserUrl)
      .pipe(map((res) => res.data));

    // resp.subscribe(x => console.log(x));

    return resp;
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
    const responseData: Array<
      GetGuidesSFResponse
    > = await this.sfService.models.guides.get(
      '*',
      {},
      {},
      instituteId
    );
    console.log(responseData[0]);
    

    if (responseData.length === 0) {
      return {
        statusCode: 200,
        message: 'no guides found.',
        data: [],
      };
    }
    // role has multiple role concatenated with ; so we split and check if the guide is for the user with requested role and send those only
    const filteredGuides = [];
    responseData.map(guide => {
      const guideRoles = guide.Role.split(';');
      console.log(guideRoles.includes(role));
      
      if (guideRoles.includes(role)) filteredGuides.push(guide);
    });

    console.log("filteredGuides",filteredGuides);
    

    const guidesResponse: Array<GetGuidesResponse> = filteredGuides.map(c => {
      return {
        name: c.Guide_Name,
        description: c.Guide_Description,
        event_string: c.Event_String,
      };
    });

    console.log(guidesResponse[0]);
    

    const guidesResponseValue = {
      statusCode: 200,
      message: 'Retrieved Successfully',
      data: guidesResponse,
    };

    return guidesResponseValue;
  }
  

  public sendReportEmail(
    email: string[],
    name: string,
    userEmail: string,
    message: string,
    // screenshotsValue: string,
    screenShotList: Array<string>,
    type?: string,
  ): void {
    //function to send simple message

    const date = new Date();
    const offset = -300; //Timezone offset for EST in minutes.
    const estDate = new Date(date.getTime() + offset * 60 * 1000);

    if (screenShotList.length == 3) {
      this.mailerService
        .sendMail({
          to: `${email}`, // List of receivers email address
          from: 'pratik2018id@gmail.com', // Senders email address
          subject: 'Bug Report from palette', // Subject line
          text: ``, // plaintext body
          html: `
        <p>This is a Report Issue submitted on Palette app at ${estDate}.</p><br>
        <p>Name: ${name}</p><br> <p>Email: ${userEmail}</p><br><p>Message: ${message}</p>
        <br>
        <a href="${screenShotList[0]}">screenshot1  
        </a>
        <br>
        <a href="${screenShotList[1]}">screenshot2  
        </a>
        <br>
        <a href="${screenShotList[2]}">screenshot3  
        </a>    
        `, // HTML body content
        })
        .then((success) => {
          console.log(success);
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (screenShotList.length == 2) {
      this.mailerService
        .sendMail({
          to: `${email}`, // List of receivers email address
          from: 'pratik2018id@gmail.com', // Senders email address
          subject: 'Bug Report from palette', // Subject line
          text: ``, // plaintext body
          html: `
      <p>This is a Report Issue submitted on Palette app at ${estDate}.</p><br>
      <p>Name: ${name}</p><br> <p>Email: ${userEmail}</p><br><p>Message: ${message}</p>
      <br>
      <a href="${screenShotList[0]}">screenshot1  
      </a>
      <br>
      <a href="${screenShotList[1]}">screenshot2  
      </a>    
      `, // HTML body content
        })
        .then((success) => {
          console.log(success);
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (screenShotList.length == 1) {
      this.mailerService
        .sendMail({
          to: `${email}`, // List of receivers email address
          from: 'pratik2018id@gmail.com', // Senders email address
          subject: 'Bug Report from palette', // Subject line
          text: ``, // plaintext body
          html: `
      <p>This is a Report Issue submitted on Palette app at ${estDate}.</p><br>
      <p>Name: ${name}</p><br> <p>Email: ${userEmail}</p><br><p>Message: ${message}</p>
      <br>
      <a href="${screenShotList[0]}">screenshot1  
      </a>   
      `, // HTML body content
        })
        .then((success) => {
          console.log(success);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      this.mailerService
        .sendMail({
          to: `${email}`, // List of receivers email address
          from: 'pratik2018id@gmail.com', // Senders email address
          subject: 'Bug Report from palette', // Subject line
          text: ``, // plaintext body
          html: `
      <p>This is a Report Issue submitted on Palette app at ${estDate}.</p><br>
      <p>Name: ${name}</p><br> <p>Email: ${userEmail}</p><br><p>Message: ${message}</p> 
      `, // HTML body content
        })
        .then((success) => {
          console.log(success);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
}
