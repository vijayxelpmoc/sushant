import { SfService } from '@gowebknot/palette-salesforce-service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ArchiveTaskDto,
  BasicDataResponse,
  BasicResponse,
} from '@src/dto/notificationDtos.dto';
import {
  getTodoResponse,
  SFResource,
  SFTask,
  SFUser,
  Task,
  TodoNotificationData,
} from '@src/types';
import { SfDate } from 'jsforce';
import _ = require('lodash');
//   import {
//     SFResource,
//     SFTask,
//     SFUser,
//     Task,
//     getTodoResponse,
//     TodoNotificationData,
//   } from 'src/student/types/ToDos-interface';
//   import { ArchiveTaskDto } from 'src/student/Dtos/archiveTodo.dto';
//   import { FirebaseService } from '../firebase/services/firebase.service';
//   import { SFService } from '../salesforce/salesforce.service';
//   import { MailersService } from '../utility/mailer/mailer.service';
//   import { NotificationsResponse } from './types/notifications-interface';
//   import {
//     BasicDataResponse,
//     BasicResponse,
//   } from 'src/auth/types/login-interface';
//   import { UtilityService } from '../utility/utility.service';

@Injectable()
export class NotificationService {
  constructor(
    private sfService: SfService, //   private firebaseService: FirebaseService, //   private mailerService: MailersService, //   private utilityService: UtilityService,
  ) {}

  /**
   * Gets user notifications
   * @returns list
   */
  async getNotifications(
    id: string,
    programId: string,
    instituteId: string,
  ): Promise<BasicDataResponse> {
    // getting notification details.
    const myNotifications = await this.sfService.models.notifications.get(
      'Id, Todo, Notification_By.Profile_Picture, Notification_By.Name, Created_at, Type, Title, Is_Read, Opportunity, Opportunity.Modification, Opportunity.Category, Modification, Event_type',
      {
        Contact: id,
        Program: programId,
      },
      {
        //    Created_at: -1
      },
      instituteId,
    );

    const notificationsList: any = [];
    const allTodosObj: any = {};

    const allTodos = await this.sfService.models.todos.get(
      'Id, Type',
      {
        Program: programId,
      },
      {},
      instituteId,
    );

    allTodos.map((todo) => {
      allTodosObj[todo.Id] = todo.Type;
    });

    myNotifications.map((element) => {
      let eventId = null;
      if (
        element['Type'] === 'Opportunity Approval Request' ||
        element['Type'] === 'Opportunity Removal Request'
      ) {
        eventId = element['Opportunity'];
      } else if (element['Type'] === 'Opportunity Modification Request') {
        eventId = element['Modification'];
      } else if (
        element['Type'] === 'To-Do Approval Request' ||
        element['Type'] === 'To-Do Modification Request' ||
        element['Type'] === 'To-Do Removal Request'
      ) {
        eventId = element['Todo'];
      }

      const data = {
        Id: element['Id'],
        EventId: eventId,
        // ProfilePicture: element['Notification_By']
        //   ? element['Notification_By']['Profile_Picture']
        //   : null,
        // CreatorName: element['Notification_By']
        //   ? element['Notification_By']['Name']
        //   : null,
        CreatedAt: element['Created_at'],
        TypeName: element['Type'] || null,
        Title: element['Title'],
        OpportunityCategory: element['Event_type'],
        IsRead: element['Is_Read'],
        TodoType: element['Todo'] ? allTodosObj[element['Todo']] : null,
      };
      notificationsList.push(data);
    });

    // for (const element of myNotifications) {
    //   let eventId = '';
    //   if (element['Type'] === 'New Comment' || element['Type'] === 'Opportunity Approval Request' || element['Type'] === 'Opportunity Removal Request') {
    //     eventId = element['Opportunity'];
    //   } else if (element['Type'] === 'Opportunity Modification Request') {
    //     eventId = element['Modification'];
    //   } else if (element['Type'] === 'To-Do Approval Request') {
    //     eventId = element['Todo'];
    //   }

    //   if (element['Todo']) {
    //     const todo = await this.sfService.models.todos.get('*', {
    //       Id: element['Todo'],
    //     });
    //     const data = {
    //       Id: element['Id'],
    //       EventId: eventId,
    //       ProfilePicture: element['Notification_By']
    //         ? element['Notification_By']['Profile_Picture']
    //         : null,
    //       CreatorName: element['Notification_By']
    //         ? element['Notification_By']['Name']
    //         : null,
    //       CreatedAt: element['Created_at'],
    //       TypeName: element['Type'] || null,
    //       Title: element['Title'],
    //       OpportunityCategory: element['Event_type'],
    //       IsRead: element['Is_Read'],
    //       Type: element['Type'],
    //       TodoType: todo[0].Type,
    //     };
    //     notificationsList.push(data);
    //   } else {
    //     const data = {
    //       Id: element['Id'],
    //       EventId: eventId,
    //       ProfilePicture: element['Notification_By']
    //         ? element['Notification_By']['Profile_Picture']
    //         : null,
    //       CreatorName: element['Notification_By']
    //         ? element['Notification_By']['Name']
    //         : null,
    //       CreatedAt: element['Created_at'],
    //       TypeName: element['Type'] || null,
    //       Title: element['Title'],
    //       OpportunityCategory: element['Event_type'],
    //       IsRead: element['Is_Read'],
    //       Type: element['Type'],
    //     };
    //     notificationsList.push(data);
    //   }
    // }
    return { statusCode: 200, message: 'success', data: notificationsList };
  }

  async getNotificationDetail(
    notificationId: string,
    programId: string,
    instituteId: string,
  ): Promise<BasicDataResponse> {
    // notification details.
    const notification = await this.sfService.models.notifications.get(
      '*',
      {
        Id: notificationId,
        Program: programId,
      },
      {},
      instituteId,
    );

    if (notification.lenght == 0) {
      throw new NotFoundException('Not found!');
    }
    const type = notification[0].Type;

    let dataObj = undefined;
    switch (
      type
      // case 'New To-Do': {
      //   dataObj = await this.utilityService.GetTodoNotificationData(
      //     notification[0].Todo,
      //   );
      //   break;
      // }
      // case 'To-Do Status Update': {
      //   dataObj = await this.utilityService.GetTodoNotificationData(
      //     notification[0].Todo,
      //   );
      //   break;
      // }
      // case 'Reminder': {
      //   dataObj = await this.utilityService.GetTodoNotificationData(
      //     notification[0].Todo,
      //   );
      //   break;
      // }
      // case 'To-Do Request': {
      //   dataObj = await this.utilityService.GetTodoNotificationData(
      //     notification[0].Todo,
      //   );
      //   break;
      // }
      // case 'To-Do Review': {
      //   dataObj = await this.utilityService.GetTodoNotificationData(
      //     notification[0].Todo,
      //   );
      //   break;
      // }
      // case 'New in Consideration': {
      //   dataObj = await this.utilityService.GetConsiderationNotificationData(
      //     notification[0].Recommendation,
      //   );
      //   break;
      // }
      // case 'New Opportunity': {
      //   dataObj = await this.utilityService.GetOpportunityNotificationData(
      //     notification[0].Opportunity,
      //     userId,
      //   );
      //   break;
      // }
      // case 'Opportunity Review': {
      //   dataObj = await this.utilityService.GetOpportunityNotificationData(
      //     notification[0].Opportunity,
      //     userId,
      //   );
      //   // dataObj = await this.utilityService.GetOpportunityApprovalNotificationData(
      //   //   notificationId,
      //   // );
      //   break;
      // }
      // case 'New Comment': {
      //   dataObj = await this.utilityService.GetOpportunityNotificationData(
      //     notification[0].Opportunity,
      //     userId,
      //   );
      //   break;
      // }
      // case 'Opportunity Removed': {
      //   dataObj = await this.utilityService.GetOpportunityNotificationData(
      //     notification[0].Opportunity,
      //     userId,
      //   );
      //   break;
      // }
      // case 'Opportunity Modified': {
      //   dataObj = await this.utilityService.GetOpportunityNotificationData(
      //     notification[0].Opportunity,
      //     userId,
      //   );
      //   break;
      // }
      // // case 'Opportunity Approval Request': {
      // //   dataObj = await this.utilityService.GetOpportunityApprovalNotificationData(
      // //     notificationId,
      // //   );
      // //   break;
      // // }
      // // case 'Opportunity Modification Request': {
      // //   // dataObj = await this.utilityService.GetOpportunityApprovalNotificationData(
      // //   //   notificationId,
      // //   // );
      // //   dataObj = await this.utilityService.GetModificationNotificationData(
      // //     notification[0].Modification,
      // //   );
      // //   break;
      // // }
      // // case 'Opportunity Removal Request': {
      // //   dataObj = await this.utilityService.GetOpportunityNotificationData(
      // //     notification[0].Opportunity,
      // //     userId,
      // //   );
      // //   break;
      // // }
      // // case 'To-Do Approval Request': {
      // //   dataObj = await this.utilityService.GetOpportunityApprovalNotificationData(
      // //     notificationId,
      // //   );
      // //   break;
      // // }
      // // case 'To-Do Modification Request': {
      // //   dataObj = await this.utilityService.GetOpportunityApprovalNotificationData(
      // //     notificationId,
      // //   );
      // //   // dataObj = await this.utilityService.GetTodoNotificationData(
      // //   //   notification[0].Todo,
      // //   // );
      // //   break;
      // // }
      // // case 'To-Do Removal Request': {
      // //   dataObj = await this.utilityService.GetOpportunityApprovalNotificationData(
      // //     notificationId,
      // //   );
      // //   // dataObj = await this.utilityService.GetTodoNotificationData(
      // //   //   notification[0].Todo,
      // //   // );
      // //   break;
      // // }
      // case 'New Personal Chat': {
      //   //statements;
      //   break;
      // }
      // case 'New Group Chat': {
      //   //statements;
      //   break;
      // }
      // case 'To-Do Modified': {
      //   dataObj = await this.utilityService.GetTodoNotificationData(
      //     notification[0].Todo,
      //   );
      //   break;
      // }
    ) {
    }

    return {
      statusCode: 200,
      message: 'Fetched notification detail successfully.',
      data: dataObj,
    };
  }

  /**
   * Updates notification is read status to true
   * @returns message and status code
   */
  async readNotifications(
    userId: string,
    programId: string,
    instituteId: string,
  ): Promise<BasicResponse> {
    // getting not read user notifications
    const mylist = await this.sfService.models.notifications.get(
      'Id',
      {
        Is_Read: false,
        Contact: userId,
        Program: programId,
      },
      {},
      instituteId,
    );

    if (mylist.length) {
      for (const element of mylist) {
        // updating is read status
        await this.sfService.models.notifications.update(
          element['Id'],
          {
            Is_Read: true,
          },
          instituteId,
        );
      }
    }
    return { statusCode: 200, message: 'ReadAllNotifications' };
  }

  async readNotification(
    userId: string,
    notificationId,
    instituteId: string,
  ): Promise<BasicResponse> {
    // getting not read user notification
    const singleNotification = await this.sfService.models.notifications.get(
      'Id',
      {
        Contact: userId,
        Id: notificationId,
      },
      {},
      instituteId,
    );
    if (singleNotification.lenght !== 0) {
      await this.sfService.models.notifications.update(
        notificationId,
        {
          Is_Read: true,
        },
        instituteId,
      );
    }
    return { statusCode: 200, message: 'ReadNotification' };
  }

  // async testing() {
  //   const todoId = 'a164x000005cIsjAAE';

  //   const todoList = await this.sfService.models.todos.get(
  //     'Id, Archived, Name, Group_Id, Assignee, Assignee.Name, Complete_By, Description, Listed_by, Task_status, Created_at, CreatedById, Type, Event_At, Event_Venue, Reminder_at',
  //     {
  //       Id: todoId,
  //       Task_status: 'Open',
  //     },{},
  // instituteId
  //   );

  //   console.log('todoList', todoList);

  //   if (todoList.length > 0) {
  //     const notificationTitle = `Reminder! Task due`;
  //     for (const todo of todoList) {
  //       console.log('todo', todo);

  //       // gets id of the Assignee.
  //       const id = todo['Assignee'];
  //       // save the notification.
  //       const noti = await this.sfService.models.notifications.create({
  //         Title: notificationTitle,
  //         Contact: id,
  //         Created_at: new Date(),
  //         Is_Read: false,
  //         // Notification_By: id,
  //         Event_type: todo.Type,
  //         Type: 'Reminder',
  //         Todo: todo.Id,
  //       });
  //       console.log('noti', noti);
  //     }
  //   }
  //   return 'ok';
  // }

  /**
   * Sends notification and email based on complete_By datetime of Todo
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async ReminderNotification(programId: string, instituteId: string) {
    // get datetime now.
    const starttime = new Date();

    const endtime = new Date();
    // adds 60 sec in datetime
    endtime.setSeconds(endtime.getSeconds() + 60);

    // get Todo with reminder in a minute.
    const todoList = await this.sfService.models.todos.get(
      'Id, Archived, Name, Group_Id, Assignee, Assignee.Name, Complete_By, Description, Listed_by, Task_status, Created_at, CreatedById, Type, Event_At, Event_Venue, Reminder_at',
      {
        Reminder_at: {
          $gte: SfDate.toDateTimeLiteral(starttime),
          $lte: SfDate.toDateTimeLiteral(endtime),
        },
        Task_status: 'Open',
        Reminder_done: false,
        Program: programId,
      },
      {},
      instituteId,
    );

    if (todoList.length > 0) {
      const notificationTitle = `Reminder! Task due`;
      for (const todo of todoList) {
        const updatedTodo = await this.sfService.models.todos.update(
          todo['Id'],
          {
            Reminder_done: true,
          },
          instituteId,
        );
        try {
          // sends push notification to student.
          await this.sendTodoNotification(
            {
              title: notificationTitle,
              message: todo['Name'],
              notifyTo: 'assignee',
              groupId: todo['Group_Id'],
              assigneeId: todo['Assignee'],
              listedById: todo['Listed_by'],
              todoId: todo['Id'],
            },
            programId,
            instituteId,
          );
        } catch (err) {
          console.log(err);
        }
        // gets id of the Assignee.
        const id = todo['Assignee'];
        // save the notification.
        const noti = await this.sfService.models.notifications.create(
          {
            Title: notificationTitle,
            Contact: id,
            Created_at: new Date(),
            Is_Read: false,
            // Notification_By: id,
            Event_type: todo.Type,
            Type: 'Reminder',
            Todo: todo.Id,
            Program: programId,
          },
          instituteId,
        );
        console.log('noti', noti);

        // gets contact's email.
        const email_data = await this.sfService.generics.contacts.get(
          'Email',
          {
            Id: id,
            Primary_Educational_institution: programId,
          },
          {},
          instituteId,
        );
        try {
          // send email reminder for todo to be completed.
          // await this.mailerService.sendTodoEmailNotification(
          //   email_data[0]['Email'],
          // );
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  // /**
  //  * Sends Reminder notification to open tasks which has deadline nearing
  //  * @returns null
  //  */
  // @Cron(CronExpression.EVERY_6_HOURS) // Every six hours
  // async sendReminderNotification() {
  //   console.log('nds k k f k f ksn fksn f');

  //   const limitingDate = new Date();
  //   limitingDate.setDate(limitingDate.getDate() + 2);

  //   const todoList = await this.sfService.models.todos.get(
  //     'Id, Archived, Name, Group_Id, Assignee, Assignee.Name, Complete_By, Description, Listed_by, Task_status, Created_at, CreatedById, Type, Event_At, Event_Venue',
  //     {
  //       complete_By: {
  //         $gte: SfDate.toDateTimeLiteral(new Date()),
  //         $lte: SfDate.toDateTimeLiteral(limitingDate),
  //       },
  //       Task_status: 'Open',
  //     },
  //   );

  //   if (todoList.length > 0) {
  //     for (const todo of todoList) {
  //       const now = new Date();
  //       const completeBy = SfDate.parseDate(todo.Complete_By);
  //       const diffMillisec = Math.abs(completeBy.valueOf() - now.valueOf());
  //       const diff = Math.floor(diffMillisec / 3600000);

  //       if (diff > 26) {
  //         continue;
  //       }

  //       const notificationTitle =
  //         diff < 24 ? `Task due in ${diff} hours` : `Task due tomorrow`;

  //       try {
  //         await this.sendTodoNotification({
  //           title: notificationTitle,
  //           message: todo.Name,
  //           notifyTo: 'assignee',
  //           groupId: todo.Group_Id,
  //           assigneeId: todo.Assignee,
  //           listedById: todo.Listed_by,
  //           todoId: todo.Id,
  //         });
  //       } catch (err) {
  //         console.log(err);
  //       }
  //     }
  //   }
  // }

  /**
   * Sends todo Notification
   * @param SFId SFId of the user to be notified
   * @param title Title of the notification
   * @param message Message of the notification
   * @param todo todo
   */
  async sendTodoNotification(
    todoNotificationData: TodoNotificationData,
    programId: string,
    instituteId: string,
  ) {
    let userToBeNotified;
    let data;
    switch (todoNotificationData.notifyTo) {
      case 'assignee': {
        userToBeNotified = todoNotificationData.assigneeId;
        const tasks = await this.getTasks(
          {
            Id: todoNotificationData.todoId,
            Assignee: todoNotificationData.assigneeId,
            Program: programId,
          },
          instituteId,
          programId,
        );
        const tasksAndResources = await this.getTodoAndResource(
          tasks,
          programId,
          instituteId,
        );
        data = tasksAndResources.data[0];
        break;
      }
      case 'listedBy': {
        userToBeNotified = todoNotificationData.listedById;
        let tasks;
        if (todoNotificationData.groupId) {
          tasks = await this.getTasks(
            {
              Group_Id: todoNotificationData.groupId,
              Listed_by: todoNotificationData.listedById,
              Program: programId,
            },
            instituteId,
            programId,
          );
        } else {
          tasks = await this.getTasks(
            {
              Id: todoNotificationData.todoId,
              Assignee: todoNotificationData.assigneeId,
              Program: programId,
            },
            instituteId,
            programId,
          );
        }
        const tasksAndResources = await this.getTodoAndResource(
          tasks,
          programId,
          instituteId,
        );
        data = tasksAndResources.data[0];
        break;
      }
    }

    //   const todo_data = await this.utilityService.GetTodoNotificationData(
    //     todoNotificationData.todoId,
    //   );

    //   return await this.firebaseService.sendNotification(
    //     userToBeNotified,
    //     todoNotificationData.title,
    //     todoNotificationData.message,
    //     {
    //       type: 'todo',
    //       data: todo_data,
    //     },
    //   );
  }

  /**
   * get tasks using the filter provided
   * @param filters sf filter
   * array of tasks assigned to the student.
   */
  async getTasks(filters, instituteId: string, programId: string) {
    const allToDo: SFTask[] = await this.sfService.models.todos.get(
      'Id, Archived, Assignee, Assignee.Name, Assignee.Profile_Picture, Complete_By, Created_at, Description, Task_status, Name, CreatedById, Type, Event_At, Event_Venue, Listed_by, Group_Id',
      filters,
      {},
      instituteId,
    );
    // not getting the CreatedById name so getting the names of the user by the ids
    const createdUserIds = [];
    const listedByContactIds = [];
    allToDo.map((todo) => {
      if (todo.Listed_by) {
        listedByContactIds.push(todo.Listed_by);
      } else {
        createdUserIds.push(todo.CreatedById);
      }
    });

    let createdByUser: SFUser[] = [];
    let listedByContact: SFUser[] = [];

    if (createdUserIds.length > 0) {
      createdByUser = await this.sfService.models.users.get(
        'Id, Name',
        {
          Id: createdUserIds,
          Program: programId,
        },
        {},
        instituteId,
      );
    }

    if (listedByContactIds.length > 0) {
      listedByContact = await this.sfService.generics.contacts.get(
        'Id, Name',
        {
          Id: listedByContactIds,
          Primary_Educational_Institution: programId,
        },
        {},
        instituteId,
      );
    }

    // creating a hash to access the user faster rather than doing to for loops
    const createdUser = {};
    createdByUser.map((user) => {
      const userObj = {
        Id: user.Id,
        Name: user.Name,
      };
      createdUser[`${user.Id}`] = userObj;
    });

    listedByContact.map((user) => {
      const userObj = {
        Id: user.Id,
        Name: user.Name,
      };
      createdUser[`${user.Id}`] = userObj;
    });

    // adding the ids and the tasks data together and filtering the response
    const toDoIds = [];
    const filteredToDos: Task[] = [];
    allToDo.map((todo) => {
      const filteredToDoObject: Task = {
        Id: todo.Id,
        Assignee: todo.Assignee.Id,
        AssigneeName: todo.Assignee.Name,
        profilePicture: todo.Assignee.Profile_Picture,
        groupId: todo.Group_Id,
        Archived: todo.Archived,
        reminderAt: todo.Reminder_at,
        name: todo.To_do,
        description: todo.Description,
        taskStatus: todo.Task_status,
        status: todo.Status,
        acceptedStatus: todo.Assignee_accepted_status,
        todoScope: todo.Todo_Scope,
        type: todo.Type,
        eventAt: todo.Event_At,
        venue: todo.Event_Venue,
        completeBy: todo.Complete_By,
        createdAt: todo.Created_at,
        listedBy: createdUser[`${todo.Listed_by}`]
          ? createdUser[`${todo.Listed_by}`]
          : createdUser[`${todo.CreatedById}`],
      };
      filteredToDos.push(filteredToDoObject);
      toDoIds.push(todo.Id);
    });
    const response = { filteredTasks: filteredToDos, taskIds: toDoIds };
    return response;
  }

  async getTodoAndResource(
    tasks: getTodoResponse,
    programId: string,
    instituteId: string,
  ) {
    const mp: any = {
      default: [],
    };

    for (const task of tasks.filteredTasks) {
      const groupId = task.groupId;
      if (!groupId) {
        mp['default'].push(task);
      } else if (!mp[groupId]) {
        mp[groupId] = [task];
      } else {
        mp[groupId].push(task);
      }
    }

    const taskIds = [];
    for (const key of Object.keys(mp)) {
      if (key === 'default') {
        for (const task of mp[key]) {
          taskIds.push(task.Id);
        }
      } else {
        taskIds.push(mp[key][0].Id);
      }
    }

    // getting all the resources on the basis the task ids
    const resources = await this.getResourcesById(
      taskIds,
      programId,
      instituteId,
    );

    const responseTodos = [];

    const listedBy = [];
    // adding them into task and structuring the response
    for (const key of Object.keys(mp)) {
      if (key === 'default') {
        for (const todo of mp[key]) {
          const todoObj = {
            Id: todo.Id,
            groupId: todo.groupId,
            name: todo.name,
            description: todo.description,
            type: todo.type,
            eventAt: todo.eventAt,
            venue: todo.venue,
            completeBy: todo.completeBy ? todo.completeBy : '',
            createdAt: todo.createdAt,
            listedBy: todo.listedBy,
            Assignee: [
              {
                Id: todo.Assignee,
                todoId: todo.Id,
                Archived: todo.Archived,
                status: todo.status,
                name: todo.AssigneeName,
                profilePicture: todo.profilePicture,
              },
            ],
          };
          const obj = {
            todo: todoObj,
            resources: resources[`${todo.Id}`] || [],
          };
          responseTodos.push(obj);
          listedBy.push(todoObj.listedBy);
        }
      } else {
        const todo = mp[key][0];
        const todoObj = {
          Id: todo.Id,
          groupId: todo.groupId,
          name: todo.name,
          description: todo.description,
          type: todo.type,
          eventAt: todo.eventAt,
          venue: todo.venue,
          completeBy: todo.completeBy ? todo.completeBy : '',
          createdAt: todo.createdAt,
          listedBy: todo.listedBy,
          Assignee: [],
        };

        for (const todo of mp[key]) {
          const assignee = {
            Id: todo.Assignee,
            todoId: todo.Id,
            Archived: todo.Archived,
            status: todo.status,
            name: todo.AssigneeName,
            profilePicture: todo.profilePicture,
          };

          todoObj.Assignee.push(assignee);
        }
        const obj = {
          todo: todoObj,
          resources: resources[`${todo.Id}`] || [],
        };
        responseTodos.push(obj);
        listedBy.push(todoObj.listedBy);
      }
    }

    const listedByResponse = _.uniqBy(listedBy, (listedBy) => listedBy.Id);
    const response = {
      statusCode: 200,
      data: responseTodos,
      listedBy: listedByResponse,
    };
    return response;
  }

  /**
   * get resources for the tasks id.
   * @param tasksId ids of the tasks for whom we want the resources.
   * array of resources assigned to the tasks.
   */
  async getResourcesById(
    tasksId: string[],
    programId: string,
    instituteId: string,
  ) {
    const resources: SFResource[] =
      await this.sfService.models.resourceConnections.get(
        'Name, Todo, Resource, Resource.Id, Resource.Name, Resource.URL, Resource.Resource_Type',
        { Todo: tasksId, Program: programId },
        {},
        instituteId,
      );
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    resources.map((resource) => {
      if (resource.Resource) {
        const resourcesObj = {
          Id: resource.Resource.Id,
          name: resource.Resource.Name,
          url: resource.Resource.URL,
          type: resource.Resource.Resource_Type,
        };
        // if a record with a todo task is present then add the object into it or if not create one
        const hashResource = allResource[`${resource.Todo}`];
        if (hashResource) {
          hashResource.push(resourcesObj);
          allResource[`${resource.Todo}`] = hashResource;
        } else {
          const Allresources = [];
          Allresources.push(resourcesObj);
          allResource[`${resource.Todo}`] = Allresources;
        }
      }
    });
    return allResource;
  }

  /**
   * Archives the Task by setting archived field to true
   * @param archiveTaskDto the taskId and archival status
   */
  async archiveTask(
    archiveTaskDto: ArchiveTaskDto,
    userId: string,
    programId: string,
    instituteId: string,
  ) {
    const { taskId, archived } = archiveTaskDto;
    const tasks = await this.sfService.models.todos.get(
      'Id, Assignee',
      {
        Id: taskId,
        Program: programId,
      },
      {},
      instituteId,
    );

    if (tasks.length == 0) {
      throw new NotFoundException('Todo Not Found');
    }

    const task = tasks[0];
    if (task.Assignee !== userId) {
      throw new BadRequestException('User not associated with the todo');
    }

    const response = await this.sfService.models.todos.update(taskId, {
      Archived: archived,
    });
    // checking if the update response from salesforce is true
    if (response.success === true) {
      return {
        statusCode: 200,
        message: 'Task archival status updated successfully',
      };
    }
  }

  async deleteAllNotifications(
    Id: string,
    programId: string,
    instituteId: string,
  ) {
    const notifications = await this.sfService.models.notifications.get(
      'Id',
      {
        Contact: Id,
        Program: programId,
      },
      {},
      instituteId,
    );

    const notificationIds: string[] = notifications.map((notif) => {
      return notif.Id;
    });

    const res = await this.sfService.models.notifications.delete(
      notificationIds,
      instituteId,
    );

    return res;
  }
}
