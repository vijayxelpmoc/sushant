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
import { SfService } from '@gowebknot/palette-salesforce-service';
import { Errors, Responses } from '@src/constants';
import { BasicDataResponse, BasicResponse } from './dtos/index';
import { PayloadService } from './payload';

@Injectable()
export class NotificationsService {
    _notifier: Notifier;
    constructor(
        private sfService: SfService,
        private payloadService: PayloadService,    
    ) {
      this._notifier = new Notifier();
    }

    /** Gets user notifications
     * @returns statusCode message & list
     */
    async getNotifications(id: string, instituteId: string, programId: string): Promise<BasicDataResponse> {
      // getting notification details.
      const myNotifications = await this.sfService.models.notifications.get(
          'Id, To_Do, Notification_By.Profile_Picture, Notification_By.Name, Created_at, Type, Title, Is_Read, Opportunity.Id, Opportunity.Modification, Opportunity.Category, Modification, Event_type',
          {
              Contact: id,
              Program: programId,
          },
          { Created_at: -1 },
          instituteId
      );

      if (myNotifications.length == 0) {
        throw new NotFoundException(`No notification found`);
      }

      const notificationsList: any = [];
      const allTodosObj: any = {};

      const allTodos = await this.sfService.models.todos.get('Id, Type', {}, {}, instituteId);

      allTodos.map(todo => {
          allTodosObj[todo.Id] = todo.Type;
      });

      myNotifications.map(element => {
      let eventId = null;
      if (
          element['Type'] === 'Opportunity Approval Request' ||
          element['Type'] === 'Opportunity Removal Request'
      ) {
          eventId = element['Opportunity.Id'];
      } else if (element['Type'] === 'Opportunity Modification Request') {
          eventId = element['Modification'];
      } else if (
          element['Type'] === 'To-Do Approval Request' ||
          element['Type'] === 'To-Do Modification Request' ||
          element['Type'] === 'To-Do Removal Request'
      ) {
          eventId = element['To_Do'];
      }

      const data = {
          Id: element['Id'],
          EventId: eventId,
          ProfilePicture: element['Notification_By']
          ? element['Notification_By']['Profile_Picture']
          : null,
          CreatorName: element['Notification_By']
          ? element['Notification_By']['Name']
          : null,
          CreatedAt: element['Created_at'],
          TypeName: element['Type'] || null,
          Title: element['Title'],
          OpportunityCategory: element['Event_type'],
          IsRead: element['Is_Read'],
          TodoType: element['To_Do'] ? allTodosObj[element['To_Do']] : null,
      };
      notificationsList.push(data);
      });
      return { statusCode: 200, message: 'success', data: notificationsList };
    }

    /**
     * Updates notifications is read status to true
     * @returns message and status code
     */
    async readNotifications(userId: string, instituteId: string, programId: string): Promise<BasicResponse> {
      // getting not read user notifications
      const mylist = await this.sfService.models.notifications.get('Id', {
          Is_Read: false,
          Contact: userId,
          Program: programId,
      }, {}, instituteId);

      if (mylist.length) {
        throw new NotFoundException();   
      }

      for (const element of mylist) {
        // updating is read status
        await this.sfService.models.notifications.update({
        Is_Read: true,
        Program: programId,
        }, element['Id'], instituteId);
      }
      return { statusCode: 200, message: 'ReadAllNotifications' };
    }

    /**
     * Updates notification is read status to true
     * @returns message and status code
     */
    async readNotification(
        userId: string,
        notificationId: string,
        instituteId: string,
        programId: string
    ): Promise<BasicResponse> {
      // getting not read user notification
      const singleNotification = await this.sfService.models.notifications.get('Id', {
          Contact: userId,
          Id: notificationId,
          Program: programId,
        }, 
        {}, 
        instituteId
      );
      if (singleNotification.lenght == 0) {
        throw new NotFoundException();    
      }

      await this.sfService.models.notifications.update({
          Is_Read: true,
          Program: programId,
        }, 
        notificationId, 
        instituteId,
      );
      return { statusCode: 200, message: 'Success' };
    }

    /**
     * Delete notifications is read status to true
     * @returns message and status code
     */
    async deleteAllNotifications(Id: string, instituteId: string, programId: string) {
      const notifications = await this.sfService.models.notifications.get('Id', {
        Contact: Id,
        Program: programId,
      }, {}, instituteId);
  
      const notificationIds: string[] = notifications.map(notification => {
        return notification.Id;
      });
      
      if (notificationIds.length >= 199) {
          throw new NotFoundException('Maximum 200 notifications can be deleted at once!');
      }
      
      await this.sfService.models.notifications.delete(notificationIds, instituteId);
      return { statusCode: 200, message: 'Deleted' };
    }

    async getNotificationDetail(
      notificationId: string,
      userId: string,
      instituteId: string,
      programId: string,
    ): Promise<BasicDataResponse> {
      // notification details.
      const notification = await this.sfService.models.notifications.get('*', {
          Id: notificationId,
          Program: programId,
        }, 
        {}, 
        instituteId
      );
  
      if (notification.lenght == 0) {
        throw new NotFoundException();
      }

      const type = notification[0].Type;
      let dataObj = undefined;
      switch (type) {
        case 'New To-Do': {
          // todo obj
          dataObj = await this.payloadService.GetTodoNotificationData(
            notification[0].To_Do,
            instituteId,
            programId,
          );
          break;
        }
        case 'To-Do Status Update': {
          // todo obj
          dataObj = await this.payloadService.GetTodoNotificationData(
            notification[0].To_Do,
            instituteId,
            programId,
          );
          break;
        }
        case 'Reminder': {
          // todo obj
          dataObj = await this.payloadService.GetTodoNotificationData(
            notification[0].To_Do,
            instituteId,
            programId,
          );
          break;
        }
        case 'New in Consideration': {
          // cons onj
          dataObj = await this.payloadService.GetConsiderationNotificationData(
            notification[0].Recommendation,
            instituteId,
            programId,
          );
          break;
        }
        case 'New Opportunity': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Review': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'New Comment': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Removed': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Modified': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'To-Do Modified': {
          // todo obj
          dataObj = await this.payloadService.GetTodoNotificationData(
            notification[0].To_Do,
            instituteId,
            programId,
          );
          break;
        }
        case 'To-Do Approved': {
          // todo obj
          dataObj = await this.payloadService.GetTodoNotificationData(
            notification[0].To_Do,
            instituteId,
            programId,
          );
          break;
        }
        case 'To-Do Rejected': {
          // todo obj
          dataObj = await this.payloadService.GetTodoNotificationData(
            notification[0].To_Do,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Approved': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Rejected': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Modification Rejected': {
          // modification obj
          dataObj = await this.payloadService.GetModificationNotificationData(
            notification[0].Modification,
            instituteId,
            programId,
          );
          break;
        }
        case 'Opportunity Removal Rejected': {
          // opp obj
          dataObj = await this.payloadService.GetOpportunityNotificationData(
            notification[0].Opportunity,
            userId,
            instituteId,
            programId,
          );
          break;
        }
      }
  
      return {
        statusCode: 200,
        message: 'Fetched notification detail successfully.',
        data: dataObj,
      };
    }
}
