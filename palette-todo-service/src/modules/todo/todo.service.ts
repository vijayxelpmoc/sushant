import {
  BadRequestException,
  ConsoleLogger,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ActivityEvents, Errors, Responses } from '@src/constants';

import { SfService } from '@gowebknot/palette-salesforce-service';
import {
  // SfService,
  Notifier,
  NotificationType,
  Role,
} from '@gowebknot/palette-wrapper';
import {
  CreateTodoDto,
  BulkUpdateTodoStatusDto,
  UpdateTodoDto,
  EventTodoDto,
  TodoResourceDto,
  CreateTodoResourcesDto,
  ApprovedStatus,
  CreateTodoV2Dto,
  Is_Accepted,
} from './dtos';
import uuid from 'uuid-random';
import {
  SFActivityActivityDetail,
  SFAdmins,
  SFEventEnrollment,
  SFEventResource,
  SFInstitute,
  SFMentors,
  SFResource,
  SFStudents,
  SFTask,
  SFTodo,
  SFUser,
  MentorParentResponse,
  ObserverParentResponse,
  StudentConnectionResponseSF,
  StudentResponse,
  TodoNotificationData,
  TodoResourceConnection,
  GuardianObserverSubRoles,
  getTodoResponse,
} from './types';
import _ from 'lodash';
import { FilteredTasks, Task } from './types/task-interface';
import axios from 'axios';

@Injectable()
export class TodoService {
  private notifier: Notifier;
  private URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/firebase/send-notification'
      : `https://pxbgeue0h5.execute-api.ap-southeast-2.amazonaws.com/dev/firebase/send-notification`;
  constructor(private sfService: SfService) {
    // LOCAL
    this.notifier = new Notifier();
  }

  // doubt
  /**
   * create todo from a event for a parent
   * @param userId user id whom the todo must be created
   * @param EventTodoDto id of the event and who listed the the event
   * statusCode and errors.
   */
  async createTodoWithEvent(
    userId: string,
    eventTodoDto: EventTodoDto,
    programId: string,
    instituteId: string,
  ) {
    const { eventId, listedBy } = eventTodoDto;
    // checking if the user is already enrolled in the event
    const getEventInstance: SFEventEnrollment[] =
      await this.sfService.models.todos.get(
        '*',
        {
          Contact: userId,
          Event: eventId,
          Program: programId,
        },
        {},
        instituteId,
      );
    if (getEventInstance.length >= 1) {
      throw new BadRequestException(Errors.USER_EXIST);
    }
    // if the user isnt enrolled then we will create a instance of paletteActivity to enroll him in the event
    await this.sfService.models.activities.create(
      {
        Contact: userId,
        Event: eventId,
        Program: programId,
      },
      instituteId,
    );

    // getting all the event details by id
    const activityDetails: SFActivityActivityDetail[] =
      await this.sfService.models.activities.get(
        'Id, To_do, Description, Start_Date, End_Date, Category, Venue , Shipping_Address, Phone, Website, Created_By, Listed_by, Record_Type_Name',
        {
          Id: eventId,
          Record_Type_Name: ['Activity', 'Activities'], // Activities
          Program: programId,
        },
        {},
        instituteId,
      );

    // getting the resources id for the event to update the task id ahead.
    const EventId = [eventId];
    const eventResourceIds: string[] = await this.getResourcesByActivityId(
      EventId,
      programId,
      instituteId,
    );

    // setting the todo type as per the event type
    let activityType = '';
    activityType = activityDetails[0].Category;
    if (activityDetails[0].Category in Object.values(ActivityEvents)) {
      activityType = activityDetails[0].Category;
    } else {
      activityType = 'Other';
    }

    // creation data
    const eventToDoDetails = {
      Assignee: userId,
      Group_Id: activityDetails[0].Id,
      Name: activityDetails[0].Name,
      Description: activityDetails[0].Description,
      Task_Status: 'Open',
      Type: activityType ? activityType : 'Other',
      Event_At: activityDetails[0].End_Date,
      Event_Venue: activityDetails[0].Venue,
      Complete_By: activityDetails[0].End_Date,
      Listed_by: listedBy || activityDetails[0].Listed_by,
      Program: programId,
    };

    // creating the todo
    const createTodoResponse = await this.sfService.models.activites.create(
      eventToDoDetails,
      instituteId,
    );

    // updating the resource with the todo id to connect the todo with the resources
    if (eventResourceIds.length >= 1) {
      for (const connection of eventResourceIds) {
        await this.sfService.models.resourceConnections.update(
          {
            Todo: createTodoResponse.id,
          },
          connection,
          instituteId,
        );
      }
    }

    return { statusCode: 200, message: Responses.TODO_CREATED };
  }

  /**
   * Return All the resources for the events by id
   * @param activitiesIds array of activities id
   */
  async getResourcesByActivityId(
    activitiesIds: string[],
    programId: string,
    instituteId: string,
    resourceIds?: boolean,
  ): Promise<any> {
    const resources: SFEventResource[] =
      await this.sfService.models.resourceConnections.get(
        'Id, Name, Event, Resource, Resource.Resource_Name, Resource.URL, Resource.Resource_Type,program',
        {
          Event: activitiesIds,
          Program: programId,
        },
        {},
        instituteId,
      );
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    const resourceConnectionsId = [];
    resources.map((resource) => {
      const resourcesObj = {
        name: resource.Resource.Resource_Name,
        url: resource.Resource.URL,
        type: resource.Resource.Resource_Type,
      };
      // if a record with a todo task is present then add the object into it or if not create one
      const hashResource = allResource[`${resource.Event}`];
      if (hashResource) {
        hashResource.push(resourcesObj);
        allResource[`${resource.Event}`] = hashResource;
      } else {
        const Allresources: any = [];
        Allresources.push(resourcesObj);
        allResource[`${resource.Event}`] = Allresources;
      }
      resourceConnectionsId.push(resource.Id);
    });
    if (resourceIds === true) {
      return resourceConnectionsId;
    }
    return allResource;
  }
  // get all todos for a given assignee
  // sendTodo scope as well

  async getTodos(userId: string, programId: string, instituteId: string) {
    const todos = await this.sfService.models.todos.get(
      '*',
      {
        Assignee: userId,
        Program: programId,
      },
      {},
      instituteId,
    );

    // // console.log(todos);

    if (!todos || todos.length === 0) {
      throw new NotFoundException(Errors.TODOS_NOT_FOUND);
    }

    // get all the guys who have assigned the todo
    const listedByArray = todos.map((todo) => todo.Listed_by);

    // get all the ids (unique)
    const listedBy = [...new Set(listedByArray)].filter((id) => id !== null);

    const assignee = await this.sfService.generics.contacts.get(
      'Id, Name, Profile_Picture',
      { Id: userId, Primary_Educational_Institution: programId },
      {},
      instituteId,
    );

    const listedByDetails = await this.sfService.generics.contacts.get(
      'Id, Name',
      {
        Id: listedBy,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );

    const listedByMap = new Map(
      listedByDetails.map((listedBy) => [listedBy.Id, listedBy.Name]),
    );

    const todoList = [];
    todos.map((todoObj) => {
      const obj = {
        todo: {
          id: todoObj.Id,
          name: todoObj.To_do,
          description: todoObj.Description,
          TaskStatus: todoObj.Task_Status,
          acceptedStatus: todoObj.Assignee_accepted_status,
          type: todoObj.Type,
          completeBy: todoObj.Complete_By,
          todoScope: todoObj.Todo_Scope,
          listedBy: {
            Id: todoObj.Listed_by,
            Name: listedByMap.get(todoObj.Listed_by),
          },
          status: todoObj.Status,
          eventVenue: todoObj.Event_Venue || null,
          eventAt: todoObj.Event_At || null,
          Assignee: [
            {
              Id: todoObj.Assignee,
              name: assignee[0].Name,
              profilePicture: assignee[0].Profile_Picture,
              status: todoObj.Status,
              Archived: todoObj.Archived,
              todoId: todoObj.Id,
            },
          ],
        },

        // resources : resources,[todoObj.Id] || null
      };

      todoList.push(obj);
    });

    return {
      statusCode: 200,
      message: Responses.TODO_FETCH_SUCCESS,
      data: {
        count: todos.length,
        listedBy: listedByDetails.map((contact) => ({
          id: contact.Id,
          name: contact.Name,
        })),
        todoList,
      },
    };
  }

  async createTodoV2(
    todo: CreateTodoV2Dto,
    userId: string,
    recordType: Role,
    programId: string,
    instituteId: string,
  ) {
    // console.log(todo, programId, instituteId);

    const groupId = uuid();
    // creating todo obj.
    const todoObj: any = {
      Name: todo.name,
      Description: todo.description,
      Task_Status: todo.status,
      Type: todo.type,
      Complete_By: todo.completeBy !== '' ? todo.completeBy : null,
      Listed_by: todo.listedBy,
      Group_Id: groupId,
      Reminder_at: todo.reminderAt !== '' ? todo.reminderAt : null,
      Event_At: todo.eventAt !== '' ? todo.eventAt : null,
      Event_Venue: todo.venue !== '' ? todo.venue : null,
      Opportunit_Id: null,
      Program: programId,
    };

    const alltodoIds = [];
    // Create a discrete Todo
    if (todo.assignee.length > 0) {
      const assigneeTodos: SFTodo[] = [];
      // Create a todo for all the assignees
      for (const assignee of todo.assignee) {
        const newtodoObj = {
          ...todoObj,
          Assignee: assignee,
          Todo_Scope: 'Discrete',
          Status: 'In Review',
          // If the assignee is the creator of the todo, then the status is accepted
          Assignee_accepted_status:
            userId === assignee ? 'Accepted' : 'Requested',
          // Program: programId,
        };
        // console.log(newtodoObj);

        // Todo created.
        const createdTodo = await this.sfService.models.todos.create(
          newtodoObj,
          instituteId,
        );
        // console.log('createdTodo', createdTodo);

        // storting todo ids.
        alltodoIds.push(createdTodo.id);
        // Notification created.
        await this.sfService.models.notifications.create(
          {
            Title: todo.name,
            Type: 'New To-Do',
            Contact: assignee,
            Created_at: new Date(),
            Is_Read: false,
            To_Do: createdTodo.id,
            Notification_Todo_Type: todo.type,
            Notification_By: userId,
            Program: programId,
          },
          instituteId,
        );

        assigneeTodos.push(newtodoObj);
      }
      return {
        statusCode: 200,
        message: 'Todo created successfully',
        groupId,
        data: assigneeTodos,
        ids: alltodoIds,
      };
    } else if (todo.InstituteId) {
      // console.log(todoObj);

      // creating global todo.
      const isAdmin = recordType === Role.Administrator;

      // A Global Todo, needs Approval from Admin
      const response = await this.sfService.models.todos.create(
        {
          ...todoObj,
          Todo_Scope: 'Global',
          // If Admin is creating a global todo, then the status is Approved
          Status: isAdmin ? 'Approved' : 'In Review',
          Parent_Account: todo.InstituteId,
          Assignee_accepted_status: 'Accepted',
          Is_Admin_Reviewed: 'No',
        },
        instituteId,
      );

      // console.log(response);

      if (!isAdmin) {
        const admins = await this.sfService.models.affiliations.get(
          'Id,Contact.Id',
          {
            Organization: todo.InstituteId,
            Role: 'Admin',
            // Program: programId,
          },
          {},
          instituteId,
        );
        const notificationTitle = `New todo`;
        const notificationMsg = `New todo requested for approval`;
        admins.map(async (admin) => {
          // create push notification
          try {
            const res = await axios.post(this.URL, {
              sfId: userId,
              title: notificationTitle,
              body: notificationMsg,
              payload: {
                data: await this.GetTodoNotificationData(
                  response.id,
                  programId,
                  instituteId,
                ),
                type: 'Create Todo',
              },
              instituteId,
              programId,
            });
            console.log('res', res.data);

            // return res;
            //   await this.firebaseService.sendNotification(
            //     admin.Contact.Id,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: await this.utilityService.GetTodoNotificationData(
            //         response.id,
            //       ),
            //       type: 'Create Todo',
            //     },
            //   );
          } catch (err) {
            console.log('err', err.response.data);
          }
          // create notification
          const name = await this.sfService.models.notifications.create(
            {
              Title: todo.name,
              Contact: admin.Contact.Id,
              Type: 'To-Do Approval Request',
              Created_at: new Date(),
              Is_Read: false,
              To_Do: response.id,
              Notification_Todo_Type: todo.type,
              Notification_By: userId,
              Program: programId,
            },
            instituteId,
          );

          // console.log('name', name);
        });
      }
      if (response.success) {
        const message = isAdmin
          ? 'Todo created successfully'
          : 'Todo creation request sent to admin';
        return {
          statusCode: 200,
          message,
          groupId,
          ids: [response.id],
        };
      } else {
        throw new InternalServerErrorException('Error creating todo');
      }
    }
  }

  async getTodo(
    userId: string,
    todoId: string,
    programId: string,
    instituteId: string,
  ) {
    // // console.log(userId, todoId, instituteId);

    const todo = await this.sfService.models.todos.get(
      '*',
      {
        Id: todoId,
        Program: programId,
        // Assignee: userId
      },
      {},
      instituteId,
    );

    // // console.log(todo);

    if (!todo) {
      throw new BadRequestException(Errors.INVALID_TODO_ID);
    }

    // // console.log(todo);

    const todoResources = await this.getResourcesById(
      [todoId],
      programId,
      instituteId,
    );
    // // console.log('todoResources', todoResources);

    const assignees = await this.sfService.generics.contacts.get(
      'Name, Profile_Picture, Id',
      {
        Id: todo.Assignee,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );

    return {
      statusCode: 200,
      message: Responses.TODO_DETAILS_FETCH_SUCCESS,
      data: {
        id: todo.Id,
        name: todo.Name,
        description: todo.Description,
        TaskStatus: todo.Task_Status,
        type: todo.Type,
        completedBy: todo.Complete_By,
        listedBy: todo.Listed_by,
        groupId: todo.Group_Id,
        status: todo.Status,
        eventAt: todo.Event_At || null,
        venue: todo.Event_Venue || null,
        resources: todoResources[todoId] || [],
        Assignee: assignees,
        Program: programId,
      },
    };
  }

  async getTodoV2(
    userId: string,
    todoId: string,
    programId: string,
    instituteId: string,
  ) {
    const todo = (
      await this.sfService.models.todos.get(
        '*',
        {
          Id: todoId,
          Program: programId,
          // Assignee: userId,
        },
        {},
        instituteId,
      )
    )[0];
    // // console.log(todo);

    if (!todo) {
      throw new BadRequestException(
        "Todo Id is either invalid or doesn't belong to you",
      );
    }

    // console.log(todo);

    const todoResources = await this.getResourcesById(
      [todo.Id],
      programId,
      instituteId,
    );
    const testResources = await this.getResourcesById(
      [todo.Id],
      programId,
      instituteId,
    );
    // console.log(todo.Assignee);

    const assignees =
      todo.Assignee !== null
        ? await this.sfService.generics.contacts.get(
            'Name, Profile_Picture, Id',
            {
              Id: todo.Assignee,
              Primary_Educational_Institution: programId,
            },
            {},
            instituteId,
          )
        : null;

    // console.log(todoResources);

    return {
      statusCode: 200,
      message: 'Todo Details',
      data: {
        id: todo.Id,
        name: todo.To_do,
        description: todo.Description,
        taskStatus: todo.Task_Status,
        type: todo.Type,
        completedBy: todo.Complete_By,
        listedBy: todo.Listed_by,
        groupId: todo.Group_Id,
        status: todo.Status,
        eventAt: todo.Event_At || null,
        venue: todo.Event_Venue || null,
        resources: todoResources[todo.Id] || [],
        Assignee: assignees,
        Program: programId,
      },
    };
  }

  // error
  async notifyOnTaskStatusChange(
    taskId: string,
    currentStatus,
    instituteId: string,
    programId: string,
  ) {
    const tasks = await this.sfService.models.todos.get(
      'Id, Archived, Name, Group_Id, Assignee, Assignee.Name, Complete_By, Description, Listed_by, Task_Status, Created_at, Created_By, Type, Event_At, Event_Venue,Program',
      { Id: taskId, Program: programId },
      {},
      instituteId,
    );

    let response;
    if (tasks.length > 0) {
      const task = tasks[0];

      const notificationTitle = `${task.Assignee.Name} has ${currentStatus} your task`;

      if (task.Listed_by !== task.Assignee) {
        response = await this.sendTodoNotification(
          {
            title: notificationTitle,
            message: task.Name,
            notifyTo: 'listedBy',
            groupId: task.Group_Id,
            assigneeId: task.Assignee,
            listedById: task.Listed_by,
            todoId: task.Id,
          },
          programId,
          instituteId,
        );
      }
    }
    return response;
  }
  /*
    update the status of the todo
  */
  async updateToDoStatus(
    userId: string,
    todoId: string,
    status: string,
    role: string,
    instituteId: string,
    programId: string,
    note?: string,
  ) {
    const requestedTodo = await this.sfService.models.todos.get(
      '*',
      {
        Id: todoId,
        Program: programId,
      },
      {},
      instituteId,
    );

    // console.log(requestedTodo);

    // if todo is invalid
    if (!requestedTodo || requestedTodo.length === 0) {
      throw new BadRequestException(Errors.INVALID_TODO_ID);
    }

    if (requestedTodo[0].Status === 'Requested') {
      throw new BadRequestException(Errors.TODO_REQUESTED_STATE);
    }
    if (
      requestedTodo[0].Todo_Scope === 'Global' &&
      !(requestedTodo[0].Listed_by === userId || role === 'Administrator')
    ) {
      throw new BadRequestException(
        'You cannot update status of this global todo!',
      );
    }

    // if this person has listed the todo, then update the status for all the assignees

    // // console.log(userId);

    if (requestedTodo[0].Listed_by === userId) {
      const todoGroupId = requestedTodo[0].Group_Id;
      // Try to get all the todo's with same group Id
      const sameGroupTodos = await this.sfService.models.todos.get(
        '*',
        {
          Group_Id: todoGroupId,
          Listed_by: userId,
          Program: programId,
        },
        {},
        instituteId,
      );

      // Update all the todo's in the response
      for (const todo of sameGroupTodos) {
        const response = await this.sfService.models.todos.update(
          {
            Task_Status: status,
            Note: note !== '' ? note : null,
            // Program: programId,
          },
          todoId,
          instituteId,
        );
        // // console.log(response);

        // Send Notification that creator has updated the status of todo.
        // The assignee can also revert back the status
        if (response.success === true) {
          // error
          console.log('succewss');

          await this.notifyOnTaskStatusChange(
            todo.Id,
            status.toUpperCase(),
            instituteId,
            programId,
          );
        }
      }
    } else {
      // Update the status of current todo only
      const response = await this.sfService.models.todos.update(
        {
          Task_Status: status,
          Note: note !== '' ? note : null,
          // Program: programId,
        },
        todoId,
        instituteId,
      );
      if (response.success === true) {
        console.log('success2');

        await this.notifyOnTaskStatusChange(
          todoId,
          status.toUpperCase(),
          instituteId,
          programId,
        );
      }
    }

    // await this.sfService.createNotification({
    //   Title: `Todo Status updated to ${status}`,
    //   Contact: requestedTodo[0].Listed_by,
    //   Created_at: new Date(),
    //   Is_Read: false,
    //   Type: 'To-Do Status Update',
    //   Todo: todoId,
    //   Notification_Todo_Type: requestedTodo[0].Type,
    //   Notification_By: userId,
    // });
    return {
      statusCode: 201,
      message: Responses.TODO_STATUS_UPDATE_SUCCESS,
    };
  }

  // bulk update
  async updateTodoStatusBulk(
    userId: string,
    todoIds: string[],
    status: string,
    role: string,
    instituteId: string,
    programId: string,
  ) {
    // Can be used as check to report any update failure
    let hasErrors = false;
    // console.log(todoIds);
    for (const i in todoIds) {
      try {
        await this.updateToDoStatus(
          userId,
          todoIds[i],
          status,
          role,
          instituteId,
          programId,
        );
      } catch (err) {
        // console.log(`[ERROR] Updating Todo [${todo}] : `, err);
        hasErrors = true;
      }
    }
    return {
      statusCode: 201,
      message: hasErrors
        ? 'There were some errors in updating all the todos'
        : 'All of the todos were updated successfully.',
    };
  }

  async createDraftToDo(
    draft: CreateTodoV2Dto,
    userId: string,
    role: string,
    programId: string,
    instituteId: string,
  ): Promise<any> {
    const groupId = uuid();
    const todoObj: SFTodo = {
      Name: draft.name,
      Description: draft.description,
      Task_Status: 'Draft',
      Type: draft.type,
      Complete_By: draft.completeBy,
      Listed_by: draft.listedBy,
      Group_Id: groupId,
      Program: programId,
    };

    if (draft.eventAt) {
      todoObj.Event_At = draft.eventAt;
    }

    if (draft.venue) {
      todoObj.Event_Venue = draft.venue;
    }

    // Create a discrete Todo
    if (draft.assignee.length) {
      const assigneeTodos: SFTodo[] = [];
      // Create a todo for all the assignees
      for (const assignee of draft.assignee) {
        assigneeTodos.push({
          ...todoObj,
          Assignee: assignee,
          Todo_Scope: 'Discrete',
          // If the assignee is the creator of the todo, then the status is accepted
          Assignee_accepted_status:
            userId === assignee ? 'Accepted' : 'Requested',
        });
      }

      const createResponse = await this.sfService.models.todos.create(
        assigneeTodos,
        instituteId,
      );
      if (
        createResponse.every(
          (response: { success: boolean }) => response.success,
        )
      ) {
        return {
          statusCode: 200,
          message: 'Todo created successfully',
          groupId,
          ids: createResponse.map((response: { id: string }) => response.id),
        };
      } else {
        throw new InternalServerErrorException('Error creating todo draft');
      }
    } else if (draft.InstituteId) {
      const isAdmin = role === Role.Administrator;
      // A Global Todo, needs Approval from Admin
      const response = await this.sfService.models.todos.create(
        {
          ...todoObj,
          Todo_Scope: 'Global',
          Program: programId,
          Parent_Account: draft.InstituteId,
        },
        instituteId,
      );
      if (response.success) {
        const message = 'Todo draft created successfully';
        return {
          statusCode: 200,
          message,
          groupId,
          ids: [response.id],
        };
      } else {
        throw new InternalServerErrorException('Error creating todo draft');
      }
    }
    const response = await this.sfService.models.todos.create(
      {
        ...todoObj,
        Program: programId,
      },
      instituteId,
    );
    if (response.success) {
      const message = 'Todo draft created successfully';
      return {
        statusCode: 200,
        message,
        groupId,
        ids: [response.id],
      };
    } else {
      throw new InternalServerErrorException('Error creating todo draft');
    }
  }

  async acceptOrRejectRequestedTodo(
    userId: string,
    todoId: string,
    status: string,
    programId: string,
    instituteId: string,
  ) {
    const requestedTodo = await this.sfService.models.todos.get(
      '*',
      {
        Id: todoId,
        Assignee: userId,
        Assignee_accepted_status: 'Requested',
        Program: programId,
      },
      {},
      instituteId,
    );

    if (requestedTodo.length === 0) {
      throw new BadRequestException(Errors.INVALID_TODO_ID);
    }
    try {
      await this.sfService.models.todos.update(
        {
          Assignee_accepted_status: status,
          // Program: programId,
        },
        todoId,
        instituteId,
      );
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }

    return {
      statusCode: 200,
      message:
        status === Is_Accepted.Accepted
          ? Responses.TODO_ACCEPTED
          : Responses.TODO_REJECTED,
    };
  }

  async acceptOrRejectRequestedTodoBulk(
    userId: string,
    todoIds: string[],
    status: string,
    programId: string,
    instituteId: string,
  ) {
    let hasErrors = false;

    for (const i in todoIds) {
      try {
        await this.sfService.models.todos.update(
          {
            Assignee_accepted_status: status,
          },
          todoIds[i],
          instituteId,
        );
      } catch (err) {
        console.log(`[ERROR] Updating Todo [${todoIds[i]}] : `, err);
        hasErrors = true;
      }
    }

    return {
      statusCode: 201,
      message: hasErrors
        ? `There were some errors in ${
            status === 'Accepted' ? 'Accepting' : 'Rejecting'
          } all the todos`
        : `All of the todos were ${
            status === 'Accepted' ? 'Accepted' : 'Rejected'
          } successfully.`,
    };
  }

  async getAdminInstituteDetails(
    userId: string,
    programId: string,
    instituteId: string,
  ) {
    const studentIds = [];
    const filteredAdmins = [];

    // getting the institute of the admin
    const institute: SFInstitute[] =
      await this.sfService.models.affiliations.get(
        'Id, Name,  Account, Account.Name',
        {
          Contact: userId,
          Role: 'Admin',
          Organization: programId,
        },
        {},
        instituteId,
      );

    if (institute.length === 0) {
      throw new BadRequestException(Errors.NO_INSTITUTES_ASSIGNED_TO_ADMIN);
    }

    // getting all the admin inside the institute
    const Admins: SFAdmins[] = await this.sfService.models.affiliations.get(
      'Contact, Contact.Name, Role, Contact.Profile_Picture, Contact.IsRegisteredOnPalette, Contact.Is_Deactive',
      {
        Account: institute[0].Account,
        Role: 'Admin',
        Organization: programId,
      },
      {},
      instituteId,
    );

    Admins.map((admin) => {
      // checking this to exclude the user that are deactivated
      // and also excluding the user requesting
      if (
        admin.Contact.Name !== userId &&
        admin.Contact.Is_Deactive === false
      ) {
        const adminObj = {
          Id: admin.Contact,
          name: admin.Contact.Name,
          profilePicture: admin.Contact.Profile_Picture || null,
          isRegistered: admin.Contact.IsRegisteredOnPalette,
        };
        filteredAdmins.push(adminObj);
      }
    });

    // getting all the students inside the institute
    const students: SFStudents[] = await this.sfService.generics.contacts.get(
      'Id, Name, Grade, Primary_Educational_Institution.Name, Profile_Picture, Is_Deactive',
      {
        Primary_Educational_Institution: institute[0].Account,
      },
      {},
      instituteId,
    );

    // getting all the mentors inside the institute
    const mentors: SFMentors[] = await this.sfService.models.affiliations.get(
      'Id, Name,  Account, Affiliation_Type, Contact, Description, Role, Contact.Id, Contact.Name, Contact.Designation, Contact.Profile_Picture, Contact.IsRegisteredOnPalette, Contact.Palette_Email, Contact.Is_Deactive',
      {
        Organization: institute[0].Account,
        Role: 'Advisor',
      },
      {},
      instituteId,
    );

    // filtering the data
    const filteredStudents: StudentResponse[] = [];
    if (students.length > 0) {
      students.map((student) => {
        // checking this to exclude the user that are deactivated
        if (student.Is_Deactive === false) {
          const filteredObj = {
            Id: student.Id,
            name: student.Name,
            profilePicture: student.Profile_Picture,
            institute: student.Primary_Educational_Institution
              ? student.Primary_Educational_Institution.Name
              : null,
            grade: student.Grade,
          };
          filteredStudents.push(filteredObj);
          studentIds.push(student.Id);
        }
      });
    }

    const filteredMentor: MentorParentResponse[] = [];
    if (mentors.length > 0) {
      mentors.map((mentor) => {
        // checking this to exclude the user that are deactivated
        if (mentor.Contact && mentor.Contact.Is_Deactive === false) {
          const filteredObj = {
            Id: mentor.Contact,
            name: mentor.Contact.Name,
            profilePicture: mentor.Contact.Profile_Picture,
            instituteName: institute[0].Account.Name,
            designation: mentor.Contact.Designation,
            isRegistered: mentor.Contact.IsRegisteredOnPalette,
          };
          filteredMentor.push(filteredObj);
        }
      });
    }

    // getting all the guardians of the students
    const studentConnection: StudentConnectionResponseSF[] =
      await this.sfService.models.relationships.get(
        'Contact.Primary_Educational_Institution, Related_Contact, Related_Contact.Profile_Picture, Related_Contact.Name, Related_Contact.Palette_Email, Type, Related_Contact.Is_Deactive',
        {
          Contact: studentIds,
          Type: GuardianObserverSubRoles,
          Program: programId,
        },
        {},
        instituteId,
      );

    const filteredParent: MentorParentResponse[] = [];
    const filteredObserver: ObserverParentResponse[] = [];

    if (studentConnection.length > 0) {
      studentConnection.map((user) => {
        // checking this to exclude the user that are deactivated
        if (user.Related_Contact.Is_Deactive === false) {
          const filteredObj = {
            Id: user.Related_Contact,
            name: user.Related_Contact.Name,
            profilePicture: user.Related_Contact.Profile_Picture,
            instituteName: institute[0].Account.Name,
            designation: user.Contact.Designation,
          };
          if (user.Type === 'Observer') filteredObserver.push(filteredObj);
          if (user.Type === 'Guardian') filteredParent.push(filteredObj);
        }
      });
    }

    // removing duplicates
    const uniqueParents: MentorParentResponse[] = filteredParent.filter(
      (v, i, a) =>
        a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i,
    );

    const uniqueObserver: ObserverParentResponse[] = filteredObserver.filter(
      (v, i, a) =>
        a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i,
    );

    return {
      students: filteredStudents,
      mentors: filteredMentor,
      parents: uniqueParents,
      observers: uniqueObserver,
      admins: filteredAdmins,
    };
  }

  async getTodoRecepients(
    userId: string,
    recordType: string,
    instituteId: string,
    programId: string,
  ) {
    // console.log(recordType, userId, instituteId);

    switch (recordType) {
      case 'Administrator':
        const adminData = await this.getAdminInstituteDetails(
          userId,
          programId,
          instituteId,
        );
        // // console.log(adminData);

        const adminRecepients = [
          ...adminData.students,
          ...adminData.mentors,
          ...adminData.parents,
          ...adminData.admins,
        ];
        return {
          statusCode: 200,
          message: Responses.RECEPIENTS_FETCH_SUCCESS,
          data: adminRecepients,
        };

      case 'Student':
        const institute = await this.sfService.generics.contacts.get(
          '*',
          {
            Id: userId,
            Primary_Educational_Institution: programId,
          },
          {},
          instituteId,
        );
        // console.log(institute);

        const studentRecepients = [];
        const relations = ['Guardian', 'Mentor'];
        for (const relation of relations) {
          // Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.Primary_Educational_Institution
          const relationRecepients =
            await this.sfService.models.relationships.get(
              'Id, Relationship_Number,Contact,Type',
              {
                Contact: userId,
                Type: relation,
                Program: programId,
              },
              {},
              instituteId,
            );
          relationRecepients.map((recepient) => {
            studentRecepients.push({
              Id: recepient.Id,
              name: recepient.Relationship_Number,
              institute,
            });
          });

          // // console.log('relationRecepients', relationRecepients);
        }

        // doubt
        // Contact.Name, Contact.Profile_Picture, Contact.Primary_Educational_Institution
        const admins = await this.sfService.models.affiliations.get(
          'Id, Affiliation_Name,Organization',
          {
            Organization:
              institute.length !== 0
                ? institute[0].Primary_Educational_Institution
                : null,
            Role: 'Admin',
            // Program: programId,
          },
          {},
          instituteId,
        );
        admins.map((admin) => {
          studentRecepients.push({
            Id: admin.Id,
            name: admin.Affiliation_Name,
            institute: admin.Organization,
          });
        });
        // // console.log('admins', admins);

        return {
          statusCode: 200,
          message: Responses.RECEPIENTS_FETCH_SUCCESS,
          data: studentRecepients,
        };
    }
  }

  async updateTodo(
    updateTodoDto: UpdateTodoDto,
    userId: string,
    RecordType: string,
    instituteId: string,
    programId: string,
    authToken: string,
  ) {
    const todoIds = updateTodoDto.Id;
    const updateObj: any = {};

    const { filteredTasks } = await this.getTasks(
      { Id: todoIds, Program: programId },
      programId,
      instituteId,
    );

    if (filteredTasks.length === 0) {
      throw new NotFoundException('Todo not found');
    }

    const groupId = filteredTasks[0].groupId;

    const valid = filteredTasks.every((task) => task.groupId === groupId);

    if (!valid) {
      throw new BadRequestException("Tasks doesn't belong to the same group");
    }

    // console.log({ aa: filteredTasks[0].Listed_by });
    if (
      filteredTasks[0].Listed_by.Id === userId ||
      RecordType === 'Administrator'
    ) {
      if (updateTodoDto.hasOwnProperty('name')) {
        const { name } = updateTodoDto;
        updateObj.Name = name;
      }

      if (updateTodoDto.hasOwnProperty('Description')) {
        const { Description } = updateTodoDto;
        updateObj.Description = Description;
      }

      if (updateTodoDto.hasOwnProperty('type')) {
        const { type } = updateTodoDto;
        updateObj.Type = type;
      }

      if (updateTodoDto.hasOwnProperty('eventAt')) {
        const { eventAt } = updateTodoDto;
        updateObj.Event_At = eventAt;
      }

      if (updateTodoDto.hasOwnProperty('venue')) {
        const { venue } = updateTodoDto;
        updateObj.Event_Venue = venue;
      }

      if (updateTodoDto.hasOwnProperty('completeBy')) {
        const { completeBy } = updateTodoDto;
        updateObj.Complete_By = completeBy;
      }

      if (updateTodoDto.hasOwnProperty('reminderAt')) {
        const { reminderAt } = updateTodoDto;
        updateObj.Reminder_at = reminderAt;
      }

      if (updateTodoDto.hasOwnProperty('Status')) {
        const { Status } = updateTodoDto;
        updateObj.Status = Status;
      }
      if (updateTodoDto.hasOwnProperty('Task_Status')) {
        const { Task_Status } = updateTodoDto;
        updateObj.Task_Status = Task_Status;
      }

      // console.log("updateTodoDto",updateTodoDto);

      // updateObj.Program = programId;
      // if block only for admin edit
      if (RecordType === 'Administrator') {
        updateObj['Opportunit_Id'] = null;
        updateObj['Status'] = 'Approved';

        const edittedData = [];
        const edittedDataObj = {};
        for (const mytodo of filteredTasks) {
          updateObj['Assignee_accepted_status'] =
            mytodo.todoScope === 'Global' ? 'Accepted' : 'Requested';
          if (mytodo.opportunity == null) {
            // updating todo.
            const result = await this.sfService.models.todos.update(
              updateObj,
              mytodo.Id,
              instituteId,
            );
            if (result.success === true) {
              edittedDataObj[mytodo.Id] = 'edited';
              edittedData.push(edittedDataObj);

              const notificationTitle = `${mytodo.name} Todo updated`;
              const notificationMsg = `${mytodo.name} Todo updated by admin`;

              const user =
                mytodo.todoScope === 'Discrete'
                  ? mytodo.Assignee
                  : mytodo.Listed_by;
              // firebase notification.
              try {
                const response = await axios.post(
                  this.URL,
                  {
                    sfId: user,
                    title: notificationTitle,
                    body: notificationMsg,
                    instituteId,
                    programId,
                    payload: {
                      data: await this.GetTodoNotificationData(
                        mytodo.Id,
                        programId,
                        instituteId,
                      ),
                      type: 'Update Todo',
                    },
                  },
                  {
                    headers: {
                      Authorization: authToken,
                    },
                  },
                );
                console.log('response', response);
              } catch (err) {
                console.log('err', err);
              }
              // create SF notification
              await this.sfService.models.notifications.create(
                {
                  Title: notificationTitle,
                  Contact: user,
                  Type: 'To-Do Modified',
                  Created_at: new Date(),
                  Is_Read: false,
                  To_Do: mytodo.Id,
                  Notification_Todo_Type: updateObj.Type,
                  Notification_By: userId,
                  Program: programId,
                },
                instituteId,
              );
            }
          } else {
            edittedDataObj[mytodo.Id] = 'not edited';
            edittedData.push(edittedDataObj);
          }
        }
        return { statusCode: 200, message: 'Success', data: edittedData };
      }
      // admin edit block ends

      // console.log(updateTodoDto);

      if (updateTodoDto.hasOwnProperty('assignees')) {
        const assigneeTodos = await this.getTasks(
          {
            Id: todoIds,
            Program: programId,
            // Assignee: updateTodoDto.assignees,
          },
          programId,
          instituteId,
        );
        // console.log(assigneeTodos);

        if (
          assigneeTodos.filteredTasks[0].Assignee != null &&
          assigneeTodos.filteredTasks[0].Assignee['Id'] !==
            updateTodoDto.assignees[0] &&
          updateTodoDto.assignees.length === 1
        ) {
          const todoDetails = await this.sfService.models.todos.get(
            '*',
            {
              Id: updateTodoDto.Id,
              Program: programId,
            },
            {},
            instituteId,
          );

          // const groupId = uuidv4();
          updateTodoDto.assignees.map(async (assignee) => {
            const todoObj: SFTodo = {
              Name: updateObj.Name,
              Description: updateObj.Description,
              Task_Status: updateObj.Task_Status,
              Status: updateObj.Status,
              Type: updateObj.Type,
              Complete_By: updateObj.Complete_By,
              Listed_by: updateObj.Listed_by,
              Group_Id: todoDetails.Group_Id,
              Reminder_at: updateObj.Reminder_at,
              Assignee: assignee,
              Program: programId,
            };
          });
          await this.sfService.models.todos.delete(todoIds);
        } else {
          const todoDetails = await this.sfService.models.todos.get(
            '*',
            {
              Id: updateTodoDto.Id,
              Program: programId,
            },
            {},
            instituteId,
          );

          // const groupId = uuidv4();
          updateTodoDto.assignees.map(async (assignee) => {
            if (assignee !== todoDetails.Assignee) {
              const todoObj: SFTodo = {
                Name: updateObj.Name,
                Description: updateObj.Description,
                Task_Status: updateObj.TaskStatus,
                Status: updateObj.Status,
                Type: updateObj.Type,
                Complete_By: updateObj.Complete_By,
                Listed_by: updateObj.Listed_by,
                Group_Id: todoDetails.Group_Id,
                Reminder_at: updateObj.Reminder_at,
                Assignee: assignee,
                Program: programId,
              };
            }
          });
        }
      }

      const updateObjArray = todoIds.map((Id) => ({
        Id,
        ...updateObj,
      }));

      // console.log("updateObjArray",updateObjArray);

      updateObjArray.forEach(async (OBJ) => {
        // console.log("OBJ",OBJ);

        const response = await this.sfService.models.todos.update(
          {
            To_do: OBJ.Name,
            Description: OBJ.Description,
            Task_Status: OBJ.Task_Status,
            Status: OBJ.Status,
            Type: OBJ.Type,
            Event_Venue: OBJ.Event_Venue,
            Event_At: OBJ.eventAt,
            Complete_By: OBJ.Complete_By,
            Listed_by: OBJ.Listed_by,
            Reminder_at: OBJ.Reminder_at,
            Assignee: OBJ.assignee,
            // Program: programId,
          },
          OBJ.Id,
          instituteId,
        );

        const success = response.success;

        // checking if the update response from salesforce is true

        if (success) {
          // Adds new Resources to the Todo
          if (updateTodoDto.hasOwnProperty('newResources')) {
            const { newResources } = updateTodoDto;
            await this.addTodoResources(
              newResources,
              todoIds,
              userId,
              programId,
              instituteId,
            );
          }

          // Deletes Specified Resources from Todo and Deletes Resource if its not linked with any other Todo
          if (updateTodoDto.hasOwnProperty('deletedResources')) {
            const { deletedResources } = updateTodoDto;
            await this.deleteTodoResource(
              deletedResources,
              todoIds,
              programId,
              instituteId,
            );
          }
        }
      });
      return { statusCode: 200, message: 'Todo updated successfully' };
    } else {
      throw new BadRequestException('You are not authorized to edit this task');
    }
  }

  // async deleteAllTodos(serId: string,) {
  //   const response = await this.sfService.models.todos.delete(todoId);
  //   const success = response.success;

  //   if (success) {
  //     return { statusCode: 200, message: Responses.TODO_DELETION_SUCCESS };
  //   } else {
  //     throw new BadRequestException(Errors.TODO_DELETION_FAILURE);
  //   }
  // }

  async deleteAllTodos(
    Id: string,
    role: string,
    programId: string,
    instituteId: string,
  ) {
    try {
      const allTodos = await this.sfService.models.todos.get(
        '*',
        { Id, role, Program: programId },
        {},
        instituteId,
      );

      const allTodoIds = allTodos.data.map((todo) => {
        return todo.todo.Id;
      });

      const deleteResponse = await this.sfService.models.todos.delete(
        allTodoIds,
        instituteId,
      );

      return deleteResponse;
    } catch (error) {
      return error;
    }
  }

  async createTodo(
    todo: CreateTodoV2Dto,
    programId: string,
    instituteId: string,
  ) {
    const groupId = uuid();

    const todoObj = [];
    for (const assignee of todo.assignee) {
      const obj: any = {
        Assignee: assignee,
        Name: todo.name,
        Description: todo.description,
        Task_Status: todo.status,
        Type: todo.type,
        Complete_By: todo.completeBy,
        Listed_by: todo.listedBy,
        Group_Id: groupId,
        Program: programId,
      };

      if (todo.eventAt) {
        obj.Event_At = todo.eventAt;
      }

      if (todo.venue) {
        obj.Event_Venue = todo.venue;
      }

      todoObj.push(obj);
    }

    const createResponse = await this.sfService.models.accounts.create(
      todoObj,
      instituteId,
    );
    // return createResponse;

    if (createResponse.every((response) => response.success)) {
      const Ids = createResponse.map((response) => response.id);
      return {
        status: 201,
        message: Responses.TODO_CREATE_SUCCESS,
        data: {
          groupId,
          Ids,
        },
      };
    } else {
      throw new InternalServerErrorException(Errors.TODO_CREATION_FAILED);
    }
  }

  /**
   * Creates resources  and creates resource connection for the todo and resource
   *@param createTodoResourcesDto Will have the todoId and the resources to be created
   *@param listedById the ID of todo creator
   */
  async createTodoResources(
    createTodoResourcesDto: CreateTodoResourcesDto,
    listedById: string,
    isNewTodo = false,
    programId: string,
    instituteId: string,
  ) {
    const todoIds = createTodoResourcesDto.todoId;

    const resourceCon: TodoResourceConnection[] = [];

    const todoList: SFTask[] = await this.sfService.models.todos.get(
      'Id, Archived, To_do, Group_Id, Assignee, Complete_By, Description, Listed_by, Task_Status, Created_at, Created_By, Type, Event_At, Event_Venue',
      {
        Id: todoIds,
        Program: programId,
      },
      {},
      instituteId,
    );
    // console.log(todoList);

    if (todoList.length == 0) {
      throw new BadRequestException('Todo not found');
    }

    const groupId = todoList[0].Group_Id;

    const isValid = todoList.every((todo) => todo.Group_Id === groupId);

    if (!isValid) {
      throw new BadRequestException("Tasks doesn't belong to the same group");
    }

    if (todoList[0].Listed_by != listedById) {
      throw new BadRequestException('You are not the creator of this Todo');
    }

    const resources = [];
    for (const resource of createTodoResourcesDto.resources) {
      const resObj = {
        Name: resource.name,
        Resource_Type: resource.type,
        URL: resource.url,
        Program: programId,
      };
      resources.push(resObj);
    }

    const resourceRes = await this.sfService.models.resources.create(
      resources,
      instituteId,
    );
    // console.log(resourceRes);

    for (const resource of resourceRes) {
      for (const todoId of todoIds) {
        const resourceConObj = {
          Todo: todoId,
          Resource: resource.id,
          Program: programId,
        };
        resourceCon.push(resourceConObj);
      }
    }

    await this.sfService.models.resourceConnections.create(
      resourceCon,
      instituteId,
    );

    if (isNewTodo) {
      for (const todo of todoList) {
        // console.log(todo);

        if (todo.Assignee !== todo.Listed_by) {
          const user = await this.sfService.generics.contacts.get(
            'Id, Name',
            {
              Id: todo.Listed_by,
              Primary_Educational_Institution: programId,
            },
            {},
            instituteId,
          );
          const message = 'New Task by ' + user[0].Name;
          await this.sendTodoNotification(
            {
              title: message,
              message: todo.To_do,
              notifyTo: 'assignee',
              groupId: todo.Group_Id,
              assigneeId: todo.Assignee,
              listedById: todo.Listed_by,
              todoId: todo.Id,
            },
            programId,
            instituteId,
          );
        }
      }
    }
    return {
      status: 201,
      message: Responses.TODO_RESOURCES_ADD_SUCCESS,
      data: resourceCon,
    };
  }

  async addTodoResources(
    newResources: TodoResourceDto[],
    todoId: string[],
    listedById: string,
    programId: string,
    instituteId: string,
  ) {
    const createTodoResourcesDto: CreateTodoResourcesDto = {
      todoId,
      resources: newResources,
    };

    return await this.createTodoResources(
      createTodoResourcesDto,
      listedById,
      true,
      programId,
      instituteId,
    );
  }

  /**
   * Deletes the Todo Resource Connection. Deletes the todo resource too if it isn't connected to any other object.
   *@param deletedResources Array of IDs of resources to be removed from Todo
   *@param todoId Id of the Todo
   */
  async deleteTodoResource(
    deletedResources: string[],
    todoId: string[],
    programId: string,
    instituteId: string,
  ) {
    deletedResources;
    todoId;

    await Promise.all(
      deletedResources.map(async (resourceId) => {
        // Gets Resource Connections of the particular resource
        const resourceCon = await this.sfService.models.resourceConnections.get(
          'Id, Resource, Todo, Resource.URL',
          {
            Resource: resourceId,
            Program: programId,
          },
          {},
          instituteId,
        );

        if (resourceCon.length > 0) {
          let count = 0;
          // Deletes Resource connection of the specified todo
          for (const resCon of resourceCon) {
            if (todoId.includes(resCon.Todo)) {
              await this.sfService.models.resourceConnections.delete(resCon.Id);
              count++;
            }
          }

          // Deletes Resource if the resource isn't linked with any other entity
          if (resourceCon.length === count) {
            const resource = resourceCon[0].Resource;
            let url = resource.URL;

            try {
              // Deletes resource from firebase
              if (url.includes(process.env.FIREBASE_TOKEN_BASE_URL)) {
                url = url.replace(process.env.FIREBASE_TOKEN_BASE_URL, '');
                const index = url.indexOf('?');
                url = url.substring(0, index);
                url.replace('%2F/g', '/');
                url.replace('%20/g', '/');
                url = decodeURIComponent(url);
                // TODO file delete
                // await this.firebaseService.deleteFile(url);
              }
            } catch (error) {
              await this.sendDeleteFileExceptionMail(error, url, resourceCon);
            }
            // Deletes resource from salesforce
            await this.sfService.models.resources.delete(
              resourceId,
              instituteId,
            );
          }
        }
      }),
    );
  }

  /**
   * get tasks using the filter provided
   * @param filters sf filter
   * array of tasks assigned to the student.
   */
  async getTasks(filters, programId: string, instituteId: string) {
    const allToDo: any[] = await this.sfService.models.todos.get(
      'Id, Archived, Assignee.Id, Assignee.Name, Assignee.Profile_Picture, Complete_By, Created_at, Description, Task_Status, To_do, Created_By, Type, Event_At, Event_Venue, Listed_by, Group_Id, Assignee_accepted_status, Todo_Scope, Status, Opportunit_Id, Reminder_at',
      filters,
      {},
      instituteId,
    );

    // not getting the Created_By name so getting the names of the user by the ids
    const createdUserIds = [];
    const listedByContactIds = [];
    allToDo != undefined &&
      allToDo.length !== 0 &&
      allToDo.map((todo) => {
        if (todo.Listed_by) {
          listedByContactIds.push(todo.Listed_by);
        } else {
          createdUserIds.push(todo.Created_By);
        }
      });

    let createdByUser: SFUser[] = [];
    let listedByContact: SFUser[] = [];

    if (createdUserIds.length > 0) {
      createdByUser = await this.sfService.models.users.get(
        'Id, Name',
        {
          Id: [...createdUserIds],
          // Role:
          // Program:programId
        },
        {},
        instituteId,
      );
    }

    if (listedByContactIds.length > 0) {
      listedByContact = await this.sfService.generics.contacts.get(
        'Id, Name',
        {
          Id: [...listedByContactIds],
          Primary_Educational_Institution: programId,
        },
        {},
        instituteId,
      );
    }

    // creating a hash to access the user faster rather than doing to for loops
    const createdUser = {};
    // // console.log(createdByUser);

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
    // console.log(createdUser);

    const toDoIds = [];
    const filteredToDos: any[] = [];
    allToDo.map((todo) => {
      const filteredToDoObject: any = {
        Id: todo.Id,
        Assignee: todo.Assignee && todo.Assignee.Id,
        AssigneeName: todo.Assignee && todo.Assignee.Name,
        profilePicture: todo.Assignee && todo.Assignee.Profile_Picture,
        groupId: todo.Group_Id,
        reminderAt: todo.Reminder_at,
        Archived: todo.Archived,
        name: todo.To_do,
        acceptedStatus: todo.Assignee_accepted_status,
        todoScope: todo.Todo_Scope,
        description: todo.Description,
        TaskStatus: todo.Task_Status,
        status: todo.Status,
        type: todo.Type,
        eventAt: todo.Event_At,
        venue: todo.Event_Venue,
        completeBy: todo.Complete_By,
        createdAt: todo.Created_at,
        Listed_by: createdUser[`${todo.Listed_by}`]
          ? createdUser[`${todo.Listed_by}`]
          : createdUser[`${todo.Created_By}`],
        opportunity: todo.Opportunit_Id,
        Program: programId,
      };
      filteredToDos.push(filteredToDoObject);
      toDoIds.push(todo.Id);
    });

    const response = { filteredTasks: filteredToDos, taskIds: toDoIds };
    // console.log(response);

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
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};

    // tasksId.forEach(async (taskId) => {
    const resources: SFResource[] =
      await this.sfService.models.resourceConnections.get(
        'Resource_Connection_Name, Todo, Resource',
        {
          Todo: tasksId,
          Program: programId,
        },
        {},
        instituteId,
      );

    resources !== [] &&
      resources.forEach(async (resource) => {
        if (resource.Resource) {
          const res = await this.sfService.models.resources.get(
            'Id,Name,Resource_Type,URL',
            {
              Id: resource.Resource,
              Program: programId,
            },
            {},
            instituteId,
          );

          const resourcesObj = {
            Id: resource.Resource,
            name: res[0].Resource_Name,
            url: res[0].URL,
            type: res[0].Resource_Type,
          };

          // if a record with a todo task is present then add the object into it or if not create one
          const hashResource = allResource[`${resource.Todo}`];
          if (hashResource) {
            hashResource.push(resourcesObj);
            allResource[`${resource.Todo}`] = hashResource;
          } else {
            const AllResources = [];
            AllResources.push(resourcesObj);
            allResource[`${resource.Todo}`] = AllResources;
          }
        }
      });

    return allResource;
  }

  async getTasksAndResource(
    tasks: FilteredTasks,
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
          // console.log("here");
          // console.log({todo:todo});
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
            //changed listedBy to Listed_by. For osme reason the newer salesforce uses the latter name instead of the former
            listedBy: todo.Listed_by,
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
        // console.log("here");
        // console.log({todo:todo});
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
          //changed listedBy to Listed_by. For osme reason the newer salesforce uses the latter name instead of the former
          listedBy: todo.Listed_by,
          Assignee: [],
          Program: programId,
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
        // console.log('todoObj.ListedBy', todoObj.listedBy);

        responseTodos.push(obj);
        listedBy.push(todoObj.listedBy);
        console.log(todoObj);
      }
    }

    // console.log(listedBy);

    const listedByResponse = _.uniqBy(listedBy, (listedBy) => listedBy.Id);
    const response = {
      statusCode: 200,
      data: responseTodos,
      listedBy: listedByResponse,
    };
    return response;
  }

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
          programId,
          instituteId,
        );
        const tasksAndResources = await this.getTasksAndResource(
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
            programId,
            instituteId,
          );
        } else {
          tasks = await this.getTasks(
            {
              Id: todoNotificationData.todoId,
              Assignee: todoNotificationData.assigneeId,
              Program: programId,
            },
            programId,
            instituteId,
          );
        }
        const tasksAndResources = await this.getTasksAndResource(
          tasks,
          programId,
          instituteId,
        );
        data = tasksAndResources.data[0];
        break;
      }
    }
    const notificationConfig = {
      userId: userToBeNotified,
      title: todoNotificationData.title,
      body: todoNotificationData.message,
      notificationId: uuid(),
      notificationData: {
        data,
        type: 'todo',
      },
    };

    return await this.notifier.send(NotificationType.PUSH, notificationConfig);
  }

  async getRequestedTodosV2(
    userId: string,
    programId: string,
    instituteId: string,
  ) {
    const requestedTodos = await this.sfService.models.todos.get(
      '*',
      {
        Assignee: userId,
        Assignee_accepted_status: 'Requested',
        Program: programId,
      },
      {},
      instituteId,
    );

    const haveTodos = requestedTodos.length !== 0;
    return {
      statusCode: 200,
      message: haveTodos ? 'Todo Requests' : 'No Todo Requests for you',
      count: requestedTodos.length,
      data: haveTodos
        ? requestedTodos.map((todo) => ({
            id: todo.Id,
            name: todo.To_do,
            description: todo.Description,
            TaskStatus: todo.Task_Status,
            type: todo.Type,
            completeBy: todo.Complete_By,
            listedBy: todo.Listed_by,
            status: todo.Status,
            eventVenue: todo.Event_Venue || null,
            eventAt: todo.Event_At || null,
          }))
        : [],
    };
  }

  /**
   * get tasks for the student by id.
   * @param studentId id of the student.
   * @param archived boolean denotes the archival status of tasks to be fetched.
   * array of tasks assigned to the student.
   */
  async getTasksByStudentId(
    studentId: string,
    archived: boolean,
    programId: string,
    instituteId: string,
  ) {
    return await this.getTasks(
      {
        Assignee: studentId,
        Program: programId,
        Archived: archived,
      },
      programId,
      instituteId,
    );
  }

  /**
   * get tasks for the listedBy by id.
   * @param listedById id of the task creator.
   * @param archived boolean, denotes whether to fetch archived or not.
   * array of tasks assigned to the student.
   */
  async getTasksByListedById(
    listedById: string,
    archived: boolean,
    programId: string,
    instituteId: string,
  ) {
    return await this.getTasks(
      {
        Listed_by: listedById,
        Archived: archived,
        Program: programId,
      },
      programId,
      instituteId,
    );
  }

  async getInstituteId(Id: string, programId: string, instituteId: string) {
    const institute = await this.sfService.models.affiliations.get(
      '*',
      {
        Contact: Id,
        Affiliation_Type: 'Educational Institution',
        Organization: programId,
      },
      {},
      instituteId,
    );

    // console.log('institute', institute[0]);

    return institute[0].Organization;
  }

  async getGlobalTasks(programId: string, instituteId: string) {
    return await this.getTasks(
      {
        Todo_Scope: 'Global',
        Program: programId,
        Status: 'Approved',
      },
      programId,
      instituteId,
    );
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

    const testresources = await this.getResourcesById(
      taskIds,
      programId,
      instituteId,
    );

    // console.log(resources);

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
            reminderAt: todo.reminderAt,
            TaskStatus: todo.TaskStatus,
            status: todo.status,
            todoScope: todo.todoScope,
            type: todo.type,
            eventAt: todo.eventAt,
            venue: todo.venue,
            completeBy: todo.completeBy ? todo.completeBy : '',
            createdAt: todo.createdAt,
            listedBy: todo.Listed_by,
            Assignee: [
              {
                Id: todo.Assignee,
                todoId: todo.Id,
                Archived: todo.Archived,
                status: todo.todoStatus,
                name: todo.AssigneeName,
                profilePicture: todo.profilePicture,
                acceptedStatus: todo.acceptedStatus,
              },
            ],
            Assignee_accepted_status: todo.acceptedStatus,
            opportunity: todo.opportunity,
            Program: programId,
          };
          const obj = {
            todo: todoObj,
            resources: resources[`${todo.Id}`] || [],
          };
          responseTodos.push(obj);

          todoObj.listedBy !== null && listedBy.push(todoObj.listedBy);
        }
      } else {
        const todo = mp[key][0];
        // console.log(todo);

        const todoObj = {
          Id: todo.Id,
          groupId: todo.groupId,
          name: todo.name,
          description: todo.description,
          reminderAt: todo.reminderAt,
          taskStatus: todo.TaskStatus,
          status: todo.status,
          acceptedStatus: todo.acceptedStatus,
          todoScope: todo.todoScope,
          type: todo.type,
          eventAt: todo.eventAt,
          venue: todo.venue,
          completeBy: todo.completeBy ? todo.completeBy : '',
          createdAt: todo.createdAt,
          listedBy: todo.Listed_by,
          Assignee: [],
          Assignee_accepted_status: todo.acceptedStatus,
          opportunity: todo.opportunity,
          Program: programId,
        };

        const tempAssignees = new Set();
        for (const todo of mp[key]) {
          const assignee = {
            Id: todo.Assignee,
            todoId: todo.Id,
            Archived: todo.Archived,
            status: todo.TaskStatus,
            name: todo.AssigneeName,
            profilePicture: todo.profilePicture,
            acceptedStatus: todo.acceptedStatus,
          };

          todoObj.Assignee.push(assignee);
          tempAssignees.add(assignee);
        }
        todoObj.Assignee = todoObj.Assignee.filter((value, index) => {
          const _value = JSON.stringify(value);
          return (
            index ===
            todoObj.Assignee.findIndex((obj) => {
              return JSON.stringify(obj) === _value;
            })
          );
        });
        const obj = {
          todo: todoObj,
          resources: resources[`${todoObj.Id}`] || [],
        };
        responseTodos.push(obj);
        todoObj.listedBy !== null && listedBy.push(todoObj.listedBy);
      }
    }

    // console.log('listedBy', listedBy);

    const listedByResponse =
      listedBy.length !== 0 &&
      listedBy[0] !== null &&
      _.uniqBy(listedBy, (listedBy) => listedBy.Id);
    const response = {
      statusCode: 200,
      data: responseTodos,
      listedBy: listedByResponse,
    };
    return response;
  }

  async getTodosV2(
    Id: string,
    role: string,
    programId: string,
    instituteId: string,
  ) {
    const tasks = await this.getTasksByStudentId(
      Id,
      false,
      programId,
      instituteId,
    );
    // console.log('listedTasks');

    const listedTasks = await this.getTasksByListedById(
      Id,
      false,
      programId,
      instituteId,
    );
    // console.log('instId');

    // const instiId = await this.getInstituteId(Id, programId, instituteId);
    const globalTasks = await this.getGlobalTasks(programId, instituteId);

    let i = 0;
    let tasksLen = tasks.filteredTasks.length;

    while (i < listedTasks.filteredTasks.length) {
      if (tasks.taskIds.indexOf(listedTasks.taskIds[i]) == -1) {
        tasks.filteredTasks[tasksLen] = listedTasks.filteredTasks[i];
        tasks.taskIds[tasksLen] = listedTasks.taskIds[i];
        tasksLen += 1;
      }
      i += 1;
    }

    i = 0;
    while (i < globalTasks.filteredTasks.length) {
      if (tasks.taskIds.indexOf(globalTasks.taskIds[i]) == -1) {
        tasks.filteredTasks[tasksLen] = globalTasks.filteredTasks[i];
        tasks.taskIds[tasksLen] = globalTasks.taskIds[i];
        tasksLen += 1;
      }
      i += 1;
    }

    return this.getTodoAndResource(tasks, programId, instituteId);
  }

  async getThirdPartyTodosV2(
    Id: string,
    role: string,
    instituteId: string,
    programId: string,
  ) {
    const allTodos = await (
      await this.getTodosV2(Id, role, programId, instituteId)
    ).data;
    // console.log(allTodos);

    const response = [];
    allTodos.map(async (current_todo) => {
      if (
        current_todo.todo.todoScope == 'Discrete' &&
        current_todo.todo.status != 'Draft' &&
        current_todo.todo.acceptedStatus == 'Accepted'
      ) {
        response.push(current_todo);
      } else if (
        current_todo.todo.todoScope == 'Global' &&
        current_todo.todo.status == 'Approved' &&
        current_todo.todo.acceptedStatus == 'Accepted'
      ) {
        response.push(current_todo);
      }
    });
    return {
      statusCode: 200,
      message: 'Success',
      data: response,
    };
  }

  async isValidAssignee(
    assignee: string[],
    listedBy: string,
    recordType: Role,
  ) {
    switch (recordType) {
      case Role.Student: {
        if (assignee[0] === listedBy && assignee.length === 1) {
          return true;
        }
        return false;
      }

      // doubt
      // case Role.Parent: {
      //   const { pupils } = await this.parentService.getParent(listedBy);
      //   const pupilIds = pupils.map(pupil => pupil.Id);
      //   return assignee.every(i => pupilIds.includes(i));
      // }

      // case Role.Advisor: {
      //   const students = await this.advisorService.getFilteredStudents(
      //     listedBy,
      //   );
      //   const studentIds = students.map(student => student.Id);
      //   return assignee.every(i => studentIds.includes(i));
      // }

      // case Role.Faculty: {
      //   const students = await this.advisorService.getFilteredStudents(
      //     listedBy,
      //   );
      //   const studentIds = students.map(student => student.Id);
      //   return assignee.every(i => studentIds.includes(i));
      // }

      // case Role.Administrator: {
      //   const filteredStudents = await (await this.adminService.getAdminInstituteDetails(
      //     listedBy,
      //   )).data.students;
      //   const studentIds = filteredStudents.map(student => student.Id);
      //   return assignee.every(i => studentIds.includes(i));
      // }
    }
    return false;
  }

  /**
   * Checks whether the assignee ID in todo is a valid.
   * A parent can assign todo to his/her dependents only.
   * An advisor can assign todo to  his/her students only.
   *@param assignee ID of the assignee in todo
   *@param listedBy ID of the creator of todo
   *@param recordType Type of the creator of todo
   */
  // TODO enable once adminservice, parentservice and advisorservice is ready

  // async isValidAssignee(
  //   assignee: string[],
  //   listedBy: string,
  //   recordType: Role,
  // ) {
  //   switch (recordType) {
  //     case Role.Student: {
  //       if (assignee[0] === listedBy && assignee.length === 1) {
  //         return true;
  //       }
  //       return false;
  //     }
  //     // Update these parent, advisor and admin service
  //     case Role.Parent: {
  //       const { pupils } = await this.parentService.getParent(listedBy);
  //       const pupilIds = pupils.map((pupil) => pupil.Id);
  //       return assignee.every((i) => pupilIds.includes(i));
  //     }

  //     case Role.Advisor: {
  //       const students = await this.advisorService.getFilteredStudents(
  //         listedBy,
  //       );
  //       const studentIds = students.map((student) => student.Id);
  //       return assignee.every((i) => studentIds.includes(i));
  //     }

  //     case Role.Faculty: {
  //       const students = await this.advisorService.getFilteredStudents(
  //         listedBy,
  //       );
  //       const studentIds = students.map((student) => student.Id);
  //       return assignee.every((i) => studentIds.includes(i));
  //     }

  //     case Role.Administrator: {
  //       const filteredStudents = await (
  //         await this.adminService.getAdminInstituteDetails(listedBy)
  //       ).data.students;
  //       const studentIds = filteredStudents.map((student) => student.Id);
  //       return assignee.every((i) => studentIds.includes(i));
  //     }
  //   }
  //   return false;
  // }

  sendDeleteFileExceptionMail = async (
    exception: any,
    fileURl: string,
    OtherData: any,
  ) => {
    //function to send exception details as email

    const beSupportEmailIds = process.env.BE_SUPPORT_EMAILS;
    if (!beSupportEmailIds) return;
    const htmlTemplate = `<p><b>Hey this a recent exception that happened at: ${new Date()}.</b></p>
    <p><b>Error:</b> ${exception}</p>
    <p><b>StackTrace:</b> ${exception.stack}</p>
    <p><b>Message:</b> ${exception.message}</p>
     <p><b>Status:</b> ${fileURl}</p>
     <p><b>Status:</b> ${JSON.stringify(OtherData)}</p>`;

    // TODO add template to email
    const emailConfig = {
      to: beSupportEmailIds.split(','),
      subject: 'Delete exception - Exception details on the Backend',
      useTemplate: false,
      body: `Hey, this a recent exception that happened at: ${new Date()}. The Error is: ${exception}`,
    };
    this.notifier.send(NotificationType.EMAIL, emailConfig);
  };

  async publishDraftTodo(Id: string, programId: string, instituteId: string) {
    // console.log(Id, instituteId);

    try {
      const updatedTodo = await this.sfService.models.todos.update(
        {
          Task_Status: 'Open',
          Status: '',
          // Program: programId,
        },
        Id,
        instituteId,
      );
      // console.log(updatedTodo);

      return { statusCode: 200, message: 'Published draft todo' };
    } catch (error) {
      return { statusCode: 500, message: 'Bad Request' };
    }
  }

  async publishDraftMultipleTodos(data, programId, instituteId) {
    try {
      for (const i in data) {
        await this.sfService.models.todos.update(
          {
            Task_Status: 'Open',
            Status: '',
          },
          data[i],
          instituteId,
        );
      }

      return { statusCode: 200, message: 'Published draft todo' };
    } catch (error) {}
  }

  async GetTodoNotificationData(
    todoId: string,
    programId: string,
    instituteId: string,
  ): Promise<any> {
    if (todoId == null || todoId == '') {
      throw new NotFoundException();
    }
    // get todo.
    const todo = await this.sfService.models.todos.get(
      'Assignee.Profile_Picture, Assignee.Name,Assignee.Id, Listed_by.Name, *',
      { Id: todoId, Program: programId },
      {},
      instituteId,
    );
    // console.log('todo', todo);

    if (todo.length == 0) {
      throw new NotFoundException(`Oops, Not Found!`);
    }

    const resources = await this.sfService.models.resourceConnections.get(
      'Name, Todo, Resource',
      { Todo: todoId },
      {},
      instituteId,
    );
    // console.log('resources', resources);

    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    resources.forEach(async (resource) => {
      if (resource.Resource) {
        const res = await this.sfService.models.resources.get(
          'Id,Resource_Name,URL,Resource_Type',
          {
            Id: resource.Resource,
            Program: programId,
          },
          {},
          instituteId,
        );
        // console.log('res', res);
        const resourcesObj = {
          Id: res.Id,
          name: res.Resource_Name,
          url: res.URL,
          type: res.Resource_Type,
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

    const todoDataObj = {
      todo: {
        Id: todo[0].Id,
        groupId: todo[0].Group_Id,
        name: todo[0].To_do,
        description: todo[0].Description,
        taskStatus: todo[0].Task_status,
        status: todo[0].Status,
        acceptedStatus: todo[0].Assignee_accepted_status,
        todoScope: todo[0].Todo_Scope,
        type: todo[0].Type,
        eventAt: todo[0].Event_At,
        venue: todo[0].Event_Venue,
        completeBy: todo[0].Complete_By,
        createdAt: todo[0].Created_at,
        listedBy: {
          Id: todo[0].Listed_by,
          Name: todo[0].Listed_by.Name,
        },
        Assignee: todo.Assignee
          ? [
              {
                Id: todo[0].Assignee.Id,
                todoId: todo[0].Id,
                Archived: todo[0].Archived,
                status: todo[0].Task_status,
                name: todo[0].Assignee.Name,
                profilePicture: todo[0].Assignee.Profile_Picture,
                acceptedStatus: todo[0].Assignee_accepted_status,
              },
            ]
          : null,
        opportunity: todo[0].Opportunity_Id,
      },
      resources: allResource > 0 ? allResource[todo[0].Id] : [],
    };
    return todoDataObj;
  }
}
