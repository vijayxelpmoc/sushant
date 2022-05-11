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

@Injectable()
export class NotificationsService {
    _notifier: Notifier;
    constructor(private sfService: SfService) {
        this._notifier = new Notifier();
    }

    /**
     * Gets user notifications
     * @returns list
     */
    async getNotifications(id: string, instituteId: string): Promise<BasicDataResponse> {
        // getting notification details.
        const myNotifications = await this.sfService.models.notifications.get(
            'Id, To_Do, Notification_By.Profile_Picture, Notification_By.Name, Created_at, Type, Title, Is_Read, Opportunity.Id, Opportunity.Modification, Opportunity.Category, Modification, Event_type',
            {
                Contact: id,
            },
            { Created_at: -1 },
            instituteId
        );

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
}
