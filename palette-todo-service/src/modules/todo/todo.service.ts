import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ActivityEvents, Errors, Responses } from '@src/constants';
import {
  SfService,
  Notifier,
  NotificationType,
} from '@gowebknot/palette-wrapper';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateTodoDto,
  BulkUpdateTodoStatusDto,
  UpdateTodoDto,
  EventTodoDto,
  TodoResourceDto,
  CreateTodoResourcesDto,
  ApprovedStatus,
} from './dtos';
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
} from './types';
import _ from 'lodash';
import { FilteredTasks, Task } from './types/task-interface';

@Injectable()
export class TodoService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  /**
   * create todo from a event for a parent
   * @param userId user id whom the todo must be created
   * @param EventTodoDto id of the event and who listed the the event
   * statusCode and errors.
   */
  async createTodoWithEvent(userId: string, eventTodoDto: EventTodoDto) {
    const { eventId, listedBy } = eventTodoDto;
    // checking if the user is already enrolled in the event
    const getEventInstance: SFEventEnrollment[] =
      await this.sfService.models.activities.get('Contact__c, Event__c', {
        Contact__c: userId,
        Event__c: eventId,
      });
    if (getEventInstance.length >= 1) {
      throw new BadRequestException(Errors.USER_EXIST);
    }
    // if the user isnt enrolled then we will create a instance of paletteActivity to enroll him in the event
    await this.sfService.models.activities.create({
      Contact__c: userId,
      Event__c: eventId,
    });

    // getting all the event details by id
    const activityDetails: SFActivityActivityDetail[] =
      await this.sfService.models.activities.get(
        'Id, Name, Description, Start_Date__c, End_Date__c, Category__c, Venue__c , ShippingAddress, Phone, Website, CreatedById, Listed_by__c, Record_Type_Name__c',
        {
          Id: eventId,
          Record_Type_Name__c: ['Activity', 'Activities'], // Activities
        },
      );

    // getting the resources id for the event to update the task id ahead.
    const EventId = [eventId];
    const eventResourceIds: string[] = await this.getResourcesByActivityId(
      EventId,
      true,
    );

    // setting the todo type as per the event type
    let activityType = '';
    activityType = activityDetails[0].Category__c;
    if (activityDetails[0].Category__c in Object.values(ActivityEvents)) {
      activityType = activityDetails[0].Category__c;
    } else {
      activityType = 'Other';
    }

    // creation data
    const eventToDoDetails = {
      Assignee__c: userId,
      Group_Id__c: activityDetails[0].Id,
      Name: activityDetails[0].Name,
      Description__c: activityDetails[0].Description,
      Task_status__c: 'Open',
      Type__c: activityType ? activityType : 'Other',
      Event_At__c: activityDetails[0].End_Date__c,
      Event_Venue__c: activityDetails[0].Venue__c,
      Complete_By__c: activityDetails[0].End_Date__c,
      Listed_by__c: listedBy || activityDetails[0].Listed_by__c,
    };

    // creating the todo
    const createTodoResponse = await this.sfService.models.todos.create(
      eventToDoDetails,
    );

    // updating the resource with the todo id to connect the todo with the resources
    if (eventResourceIds.length >= 1) {
      for (const connection of eventResourceIds) {
        await this.sfService.models.resourceConnections.update(connection, {
          Todo__c: createTodoResponse.id,
        });
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
    resourceIds?: boolean,
  ): Promise<any> {
    const resources: SFEventResource[] =
      await this.sfService.models.resourceConnections.get(
        'Id, Name, Event__c, Resource__c, Resource__r.Name, Resource__r.URL__c, Resource__r.Resource_Type__c',
        {
          Event__c: activitiesIds,
        },
      );
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    const resourceConnectionsId = [];
    resources.map((resource) => {
      const resourcesObj = {
        name: resource.Resource__r.Name,
        url: resource.Resource__r.URL__c,
        type: resource.Resource__r.Resource_Type__c,
      };
      // if a record with a todo task is present then add the object into it or if not create one
      const hashResource = allResource[`${resource.Event__c}`];
      if (hashResource) {
        hashResource.push(resourcesObj);
        allResource[`${resource.Event__c}`] = hashResource;
      } else {
        const Allresources: any = [];
        Allresources.push(resourcesObj);
        allResource[`${resource.Event__c}`] = Allresources;
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

  async getTodos(userId: string) {
    const todos = await this.sfService.models.todos.get('*', {
      Assignee__c: userId,
    });

    if (!todos || todos.length === 0) {
      throw new NotFoundException(Errors.TODOS_NOT_FOUND);
    }

    // get all the guys who have assigned the todo
    const listedByArray = todos.map((todo) => todo.Listed_by__c);

    // get all the ids (unique)
    const listedBy = [...new Set(listedByArray)].filter((id) => id !== null);

    const assignee = await this.sfService.generics.contacts.get(
      'Id, Name, Profile_Picture__c',
      { Id: userId },
    );

    const listedByDetails = await this.sfService.generics.contacts.get(
      'Id, Name',
      {
        Id: listedBy,
      },
    );

    const listedByMap = new Map(
      listedByDetails.map((listedBy) => [listedBy.Id, listedBy.Name]),
    );

    const todoList = [];
    todos.map((todoObj) => {
      const obj = {
        todo: {
          id: todoObj.Id,
          name: todoObj.Name,
          description: todoObj.Description__c,
          taskStatus: todoObj.Task_status__c,
          acceptedStatus: todoObj.Assignee_accepted_status__c,
          type: todoObj.Type__c,
          completeBy: todoObj.Complete_By__c,
          todoScope: todoObj.Todo_Scope__c,
          listedBy: {
            Id: todoObj.Listed_by_c,
            Name: listedByMap.get(todoObj.Listed_by__c),
          },
          status: todoObj.Status__c,
          eventVenue: todoObj.Event_Venue__c || null,
          eventAt: todoObj.Event_At__c || null,
          Assignee: [
            {
              Id: todoObj.Assignee__c,
              name: assignee[0].Name,
              profilePicture: assignee[0].Profile_Picture__c,
              status: todoObj.Status__c,
              Archived: todoObj.Archived__c,
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

  async getTodo(userId: string, todoId: string) {
    const todo = (
      await this.sfService.models.todos.get('*', {
        Id: todoId,
        Assignee__c: userId,
      })
    )[0];
    if (!todo) {
      throw new BadRequestException(Errors.INVALID_TODO_ID);
    }

    // const resources = await getResourcesById([todo.Id]);
    const assignees = await this.sfService.generics.contacts.get(
      'Name, Profile_Picture__c, Id',
      {
        Id: todo.Assignee__c,
      },
    );

    return {
      statusCode: 200,
      message: Responses.TODO_DETAILS_FETCH_SUCCESS,
      data: {
        id: todo.Id,
        name: todo.Name,
        description: todo.Description__c,
        taskStatus: todo.Task_status__c,
        type: todo.Type__c,
        completedBy: todo.Complete_By__c,
        listedBy: todo.Listed_by__c,
        groupId: todo.Group_Id__c,
        status: todo.Status__c,
        eventAt: todo.Event_At__c || null,
        venue: todo.Event_Venue__c || null,
        // resources: todoResources[todo.Id] || [],
        Assignee: assignees,
      },
    };
  }
  /*
    update the status of the todo
  */
  async updateToDoStatus(userId: string, todoId: string, status: string) {
    const requestedTodo = await this.sfService.models.todos.get('*', {
      Id: todoId,
      Assignee__c: userId,
    });

    // if todo is invalid
    if (!requestedTodo || requestedTodo.length === 0) {
      throw new BadRequestException(Errors.INVALID_TODO_ID);
    }

    if (requestedTodo[0].Status__c === 'Requested') {
      throw new BadRequestException(Errors.TODO_REQUESTED_STATE);
    }
    // if this person has listed the todo, then update the status for all the assignees

    if (requestedTodo.Listed_by__c === userId) {
      const todoGroupId = requestedTodo[0].Group_Id__c;
      const sameGroupTodos = await this.sfService.models.todos.get('*', {
        Group_Id__c: todoGroupId,
        Listed_by__c: userId,
      });

      sameGroupTodos.map(async (groupTodo) => {
        await this.sfService.models.todos.update(
          {
            Status__c: status,
          },
          groupTodo.Id,
        );
      });
    } else {
      await this.sfService.models.todos.update(
        {
          Status__c: status,
        },
        todoId,
      );
    }
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
  ) {
    let hasErrors = false;

    todoIds.map(async (todo) => {
      try {
        await this.updateToDoStatus(userId, todo, status);
      } catch (error) {
        hasErrors = true;
      }
    });

    return {
      statusCode: 201,
      message: hasErrors
        ? Errors.TODOS_BULK_UPDATE_PARTIAL_FAILURE
        : Responses.TODOS_BULK_UPDATE_SUCCESS,
    };
  }

  async createDraftToDo(
    draft: CreateTodoDto,
    userId: string,
    role: string,
  ): Promise<any> {
    const groupId = uuidv4();
    const todoObj: SFTodo = {
      Name: draft.name,
      Description__c: draft.description,
      Task_status__c: draft.status,
      Type__c: draft.type,
      Complete_By__c: draft.completeBy,
      Listed_by__c: draft.listedBy,
      Status__c: 'Draft',
      Group_Id__c: groupId,
    };

    if (draft.eventAt) {
      todoObj.Event_At__c = draft.eventAt;
    }

    if (draft.venue) {
      todoObj.Event_Venue__c = draft.venue;
    }

    // Create a discrete Todo
    if (draft.assignee.length) {
      const assigneeTodos: SFTodo[] = [];
      // Create a todo for all the assignees
      for (const assignee of draft.assignee) {
        assigneeTodos.push({
          ...todoObj,
          Assignee__c: assignee,
          Todo_Scope__c: 'Discrete',
          // If the assignee is the creator of the todo, then the status is accepted
          Assignee_accepted_status__c:
            userId === assignee ? 'Accepted' : 'Requested',
        });
      }

      const createResponse = await this.sfService.models.todos.create(
        assigneeTodos,
      );

      if (
        createResponse.every(
          (response: { success: boolean }) => response.success,
        )
      ) {
        return {
          statusCode: 201,
          message: Responses.TODO_DRAFT_CREATE_SUCCESS,
          data: {
            groupId,
            ids: createResponse.map((response: { id: string }) => response.id),
          },
        };
      } else {
        throw new InternalServerErrorException(Errors.TODO_CRAFT_CREATE_ERROR);
      }
    } else if (draft.instituteId) {
      const response = await this.sfService.models.todos.create({
        ...todoObj,
        Todo_Scope__c: 'Global',
        Parentid__c: draft.instituteId,
      });
      if (response.success) {
        return {
          statusCode: 201,
          message: Responses.TODO_DRAFT_CREATE_SUCCESS,
          data: {
            groupId,
            ids: [response.id],
          },
        };
      } else {
        throw new InternalServerErrorException(Errors.TODO_CRAFT_CREATE_ERROR);
      }
    }
    return {
      statusCode: 201,
      message: Responses.TODO_DRAFT_CREATE_SUCCESS,
    };
  }

  async acceptOrRejectRequestedTodo(
    userId: string,
    todoId: string,
    status: string,
  ) {
    const requestedTodo = await this.sfService.models.todos.get('*', {
      Id: todoId,
      Assignee__c: userId,
      Assignee_accepted_status__c: 'Requested',
    });

    if (requestedTodo.length === 0) {
      throw new BadRequestException(Errors.INVALID_TODO_ID);
    }
    try {
      await this.sfService.models.todos.update(
        {
          Assignee_accepted_status__c: status,
        },
        todoId,
      );
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }

    return {
      statusCode: 200,
      message:
        status === ApprovedStatus.Approved
          ? Responses.TODO_ACCEPTED
          : Responses.TODO_REJECTED,
    };
  }

  async acceptOrRejectRequestedTodoBulk(
    userId: string,
    todoIds: string[],
    status: string,
  ) {
    let hasErrors = false;
    todoIds.map(async (id) => {
      try {
        await this.sfService.models.todos.update(
          {
            Assignee_accepted_status__c: status,
          },
          id,
        );
      } catch (err) {
        hasErrors = true;
      }
    });
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

  async getAdminInstituteDetails(userId: string) {
    const studentIds = [];
    const filteredAdmins = [];

    // getting the institute of the admin
    const institute: SFInstitute[] =
      await this.sfService.models.affiliations.get(
        'Id, Name,  hed__Account__c, hed__Account__r.Name',
        {
          hed__Contact__c: userId,
          hed__Role__c: 'Admin',
        },
      );

    if (institute.length === 0) {
      throw new BadRequestException(Errors.NO_INSTITUTES_ASSIGNED_TO_ADMIN);
    }

    // getting all the admin inside the institute
    const Admins: SFAdmins[] = await this.sfService.models.affiliations.get(
      'hed__Contact__c, hed__Contact__r.Name, hed__Role__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__Account__c: institute[0].hed__Account__c,
        hed__Role__c: 'Admin',
      },
    );

    Admins.map((admin) => {
      // checking this to exclude the user that are deactivated
      // and also excluding the user requesting
      if (
        admin.hed__Contact__c !== userId &&
        admin.hed__Contact__r.Is_Deactive__c === false
      ) {
        const adminObj = {
          Id: admin.hed__Contact__c,
          name: admin.hed__Contact__r.Name,
          profilePicture: admin.hed__Contact__r.Profile_Picture__c || null,
          isRegistered: admin.hed__Contact__r.IsRegisteredOnPalette__c,
        };
        filteredAdmins.push(adminObj);
      }
    });

    // getting all the students inside the institute
    const students: SFStudents[] = await this.sfService.generics.contacts.get(
      'Id, Name, Grade__c, Primary_Educational_Institution__r.Name, Profile_Picture__c, Is_Deactive__c',
      {
        Primary_Educational_Institution__c: institute[0].hed__Account__c,
      },
    );

    // getting all the mentors inside the institute
    const mentors: SFMentors[] = await this.sfService.models.affiliations.get(
      'Id, Name,  hed__Account__c, hed__Affiliation_Type__c, hed__Contact__c, hed__Description__c, hed__Role__c, hed__Contact__r.Id, hed__Contact__r.Name, hed__Contact__r.Designation__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Palette_Email__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__Account__c: institute[0].hed__Account__c,
        hed__Role__c: 'Advisor',
      },
    );

    // filtering the data
    const filteredStudents: StudentResponse[] = [];
    if (students.length > 0) {
      students.map((student) => {
        // checking this to exclude the user that are deactivated
        if (student.Is_Deactive__c === false) {
          const filteredObj = {
            Id: student.Id,
            name: student.Name,
            profilePicture: student.Profile_Picture__c,
            institute: student.Primary_Educational_Institution__r
              ? student.Primary_Educational_Institution__r.Name
              : null,
            grade: student.Grade__c,
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
        if (
          mentor.hed__Contact__r &&
          mentor.hed__Contact__r.Is_Deactive__c === false
        ) {
          const filteredObj = {
            Id: mentor.hed__Contact__r.Id,
            name: mentor.hed__Contact__r.Name,
            profilePicture: mentor.hed__Contact__r.Profile_Picture__c,
            instituteName: institute[0].hed__Account__r.Name,
            designation: mentor.hed__Contact__r.Designation__c,
            isRegistered: mentor.hed__Contact__r.IsRegisteredOnPalette__c,
          };
          filteredMentor.push(filteredObj);
        }
      });
    }

    // getting all the guardians of the students
    const studentConnection: StudentConnectionResponseSF[] =
      await this.sfService.models.relationships.get(
        'hed__Contact__r.Primary_Educational_Institution__c, hed__RelatedContact__c, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.Name, hed__RelatedContact__r.Palette_Email__c, hed__Type__c, hed__RelatedContact__r.Is_Deactive__c',
        {
          hed__Contact__c: studentIds,
          hed__Type__c: GuardianObserverSubRoles,
        },
      );

    const filteredParent: MentorParentResponse[] = [];
    const filteredObserver: ObserverParentResponse[] = [];

    if (studentConnection.length > 0) {
      studentConnection.map((user) => {
        // checking this to exclude the user that are deactivated
        if (user.hed__RelatedContact__r.Is_Deactive__c === false) {
          const filteredObj = {
            Id: user.hed__RelatedContact__c,
            name: user.hed__RelatedContact__r.Name,
            profilePicture: user.hed__RelatedContact__r.Profile_Picture__c,
            instituteName: institute[0].hed__Account__r.Name,
            designation: user.hed__Contact__r.Designation__c,
          };
          if (user.hed__Type__c === 'Observer')
            filteredObserver.push(filteredObj);
          if (user.hed__Type__c === 'Guardian')
            filteredParent.push(filteredObj);
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

  async getTodoRecepients(userId: string, recordType: string) {
    switch (recordType) {
      case 'Administrator':
        const adminData = await this.getAdminInstituteDetails(userId);
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
        const institute = (
          await this.sfService.generics.contacts.get(
            'Primary_Educational_Institution__c',
            {
              Id: userId,
            },
          )
        )[0].Primary_Educational_Institution__c;
        const studentRecepients = [];
        const relations = ['Guardian', 'Mentor'];
        for (const relation of relations) {
          const relationRecepients =
            await this.sfService.models.relationships.get(
              'hed__RelatedContact__r.id, hed__RelatedContact__r.Name, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.Primary_Educational_Institution__c',
              {
                hed__Contact__c: userId,
                hed__Type__c: relation,
              },
            );
          relationRecepients.map((recepient) => {
            studentRecepients.push({
              Id: recepient.hed__RelatedContact__r.Id,
              name: recepient.hed__RelatedContact__r.Name,
              profilePicture:
                recepient.hed__RelatedContact__r.Profile_Picture__c,
              institute:
                recepient.hed__RelatedContact__r
                  .Primary_Educational_Institution__c,
            });
          });
        }
        const admins = await this.sfService.models.affiliations.get(
          'Id, hed__Contact__r.Name, hed__Contact__r.Profile_Picture__c, hed__Contact__r.Primary_Educational_Institution__c',
          {
            hed__Account__c: institute,
            hed__Role__c: 'Admin',
          },
        );
        admins.map((admin) => {
          studentRecepients.push({
            Id: admin.Id,
            name: admin.hed__Contact__r.Name,
            profilePicture: admin.hed__Contact__r.Profile_Picture__c,
            institute: admin.hed__Contact__r.Primary_Educational_Institution__c,
          });
        });

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
    todoId: string,
  ) {
    const todoIds = todoId;
    const updateObj: any = {};

    const filteredTasks = await this.sfService.models.todos.get('*', {
      Id: todoIds,
    });
    if (filteredTasks.length === 0) {
      throw new NotFoundException(Errors.TODO_NOT_FOUND);
    }

    const groupId = filteredTasks[0].groupId;

    const valid = filteredTasks.every((task) => task.groupId === groupId);

    if (!valid) {
      throw new BadRequestException(Errors.INVALID_TASKS_FOR_GROUP);
    }
    // updated istedBy.Id to listed_by__c
    if (filteredTasks[0].Listed_by__c !== userId) {
      throw new BadRequestException(Errors.REQUESTER_NOT_CREATOR_OF_TODO);
    }

    if (updateTodoDto.hasOwnProperty('name')) {
      const { name } = updateTodoDto;
      updateObj.Name = name;
    }

    if (updateTodoDto.hasOwnProperty('Description')) {
      const { Description } = updateTodoDto;
      updateObj.Description__c = Description;
    }

    if (updateTodoDto.hasOwnProperty('type')) {
      const { type } = updateTodoDto;
      updateObj.Type__c = type;
    }

    if (updateTodoDto.hasOwnProperty('eventAt')) {
      const { eventAt } = updateTodoDto;
      updateObj.Event_At__c = eventAt;
    }

    if (updateTodoDto.hasOwnProperty('venue')) {
      const { venue } = updateTodoDto;
      updateObj.Event_Venue__c = venue;
    }

    if (updateTodoDto.hasOwnProperty('completeBy')) {
      const { completeBy } = updateTodoDto;
      updateObj.Complete_By__c = completeBy;
    }

    const updateObjArray = [todoIds].map((Id) => ({
      Id,
      ...updateObj,
    }));

    const response = await this.sfService.models.todos.update(updateObjArray);

    const success = response.every((res) => res.success);

    // checking if the update response from salesforce is true

    if (success) {
      // Adds new Resources to the Todo
      if (updateTodoDto.hasOwnProperty('newResources')) {
        const { newResources } = updateTodoDto;
        await this.addTodoResources(newResources, [todoIds], userId);
      }

      // Deletes Specified Resources from Todo and Deletes Resource if its not linked with any other Todo
      if (updateTodoDto.hasOwnProperty('deletedResources')) {
        const { deletedResources } = updateTodoDto;
        await this.deleteTodoResource(deletedResources, [todoIds]);
      }
    }
    return { statusCode: 200, message: Responses.TODO_UPDATE_SUCCESS };
  }

  async bulkUpdateStatus(
    userId: string,
    bulkUpdateTodoStatusDto: BulkUpdateTodoStatusDto,
  ) {
    const { todoIds, todoStatus } = bulkUpdateTodoStatusDto;

    const updateArray = todoIds.map((todo) => {
      return {
        Id: todo,
        Task_status__c: todoStatus,
      };
    });

    const response = await this.sfService.models.todos.update(updateArray);
    const success = response.every((res) => res.success);
    if (success) {
      return {
        statusCode: 201,
        message: Responses.TODOS_BULK_UPDATE_SUCCESS,
      };
    } else {
      throw new BadRequestException(Errors.TODOS_BULK_UPDATE_PARTIAL_FAILURE);
    }
  }

  async deleteTodo(todoId: string) {
    const response = await this.sfService.models.todos.delete(todoId);
    const success = response.success;

    if (success) {
      return { statusCode: 200, message: Responses.TODO_DELETION_SUCCESS };
    } else {
      throw new BadRequestException(Errors.TODO_DELETION_FAILURE);
    }
  }

  async createTodo(todo: CreateTodoDto) {
    const groupId = uuidv4();

    const todoObj = [];
    for (const assignee of todo.assignee) {
      const obj: any = {
        Assignee__c: assignee,
        Name: todo.name,
        Description__c: todo.description,
        Task_status__c: todo.status,
        Status__c: todo.approved_status,
        Type__c: todo.type,
        Complete_By__c: todo.completeBy,
        Listed_by__c: todo.listedBy,
        Group_Id__c: groupId,
      };

      if (todo.eventAt) {
        obj.Event_At__c = todo.eventAt;
      }

      if (todo.venue) {
        obj.Event_Venue__c = todo.venue;
      }

      todoObj.push(obj);
    }

    const createResponse = await this.sfService.models.accounts.create(todoObj);
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
  ) {
    const todoIds = createTodoResourcesDto.todoId;

    const resourceCon: TodoResourceConnection[] = [];

    const todoList: SFTask[] = await this.sfService.models.todos.get(
      'Id, Archived__c, Name, Group_Id__c, Assignee__c, Assignee__r.Name, Complete_By__c, Description__c, Listed_by__c, Task_status__c, Created_at__c, CreatedById, Type__c, Event_At__c, Event_Venue__c',
      {
        Id: todoIds,
      },
    );

    if (todoList.length == 0) {
      throw new BadRequestException(Errors.TODO_NOT_FOUND);
    }

    const groupId = todoList[0].Group_Id__c;

    const isValid = todoList.every((todo) => todo.Group_Id__c === groupId);

    if (!isValid) {
      throw new BadRequestException(Errors.INVALID_TASKS_FOR_GROUP);
    }

    if (todoList[0].Listed_by__c != listedById) {
      throw new BadRequestException(Errors.REQUESTER_NOT_CREATOR_OF_TODO);
    }

    const resources = [];
    for (const resource of createTodoResourcesDto.resources) {
      const resObj = {
        Name: resource.name,
        Resource_Type__c: resource.type,
        URL__c: resource.url,
      };
      resources.push(resObj);
    }

    const resourceRes = await this.sfService.models.resources.create(resources);

    for (const resource of resourceRes) {
      for (const todoId of todoIds) {
        const resourceConObj = {
          Todo__c: todoId,
          Resource__c: resource.id,
        };
        resourceCon.push(resourceConObj);
      }
    }

    await this.sfService.models.resourceConnections.create(resourceCon);

    if (isNewTodo) {
      for (const todo of todoList) {
        if (todo.Assignee__c !== todo.Listed_by__c) {
          const user = await this.sfService.generics.contacts.get('Id, Name', {
            Id: todo.Listed_by__c,
          });
          const message = 'New Task by ' + user[0].Name;

          this.sendTodoNotification({
            title: message,
            message: todo.Name,
            notifyTo: 'assignee',
            groupId: todo.Group_Id__c,
            assigneeId: todo.Assignee__c,
            listedById: todo.Listed_by__c,
            todoId: todo.Id,
          });
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
  ) {
    const createTodoResourcesDto: CreateTodoResourcesDto = {
      todoId,
      resources: newResources,
    };

    return await this.createTodoResources(createTodoResourcesDto, listedById);
  }

  /**
   * Deletes the Todo Resource Connection. Deletes the todo resource too if it isn't connected to any other object.
   *@param deletedResources Array of IDs of resources to be removed from Todo
   *@param todoId Id of the Todo
   */
  async deleteTodoResource(deletedResources: string[], todoId: string[]) {
    deletedResources;
    todoId;

    await Promise.all(
      deletedResources.map(async (resourceId) => {
        // Gets Resource Connections of the particular resource
        const resourceCon = await this.sfService.models.resourceConnections.get(
          'Id, Resource__c, Todo__c, Resource__r.URL__c',
          {
            Resource__c: resourceId,
          },
        );

        if (resourceCon.length > 0) {
          let count = 0;
          // Deletes Resource connection of the specified todo
          for (const resCon of resourceCon) {
            if (todoId.includes(resCon.Todo__c)) {
              await this.sfService.models.resourceConnections.delete(resCon.Id);
              count++;
            }
          }

          // Deletes Resource if the resource isn't linked with any other entity
          if (resourceCon.length === count) {
            const resource = resourceCon[0].Resource__r;
            let url = resource.URL__c;

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
            await this.sfService.models.resources.delete(resourceId);
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
  async getTasks(filters) {
    const allToDo: SFTask[] = await this.sfService.models.todos.get(
      'Id, Archived__c, Assignee__c, Assignee__r.Name, Assignee__r.Profile_Picture__c, Complete_By__c, Created_at__c, Description__c, Task_status__c, Name, CreatedById, Type__c, Event_At__c, Event_Venue__c, Listed_by__c, Group_Id__c',
      filters,
    );
    // not getting the CreatedById name so getting the names of the user by the ids
    const createdUserIds = [];
    const listedByContactIds = [];
    allToDo.map((todo) => {
      if (todo.Listed_by__c) {
        listedByContactIds.push(todo.Listed_by__c);
      } else {
        createdUserIds.push(todo.CreatedById);
      }
    });

    let createdByUser: SFUser[] = [];
    let listedByContact: SFUser[] = [];

    if (createdUserIds.length > 0) {
      createdByUser = await this.sfService.models.users.get('Id, Name', {
        Id: createdUserIds,
      });
    }

    if (listedByContactIds.length > 0) {
      listedByContact = await this.sfService.generics.contacts.get('Id, Name', {
        Id: listedByContactIds,
      });
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
        Assignee: todo.Assignee__c,
        AssigneeName: todo.Assignee__r.Name,
        profilePicture: todo.Assignee__r.Profile_Picture__c,
        groupId: todo.Group_Id__c,
        Archived: todo.Archived__c,
        name: todo.Name,
        description: todo.Description__c,
        status: todo.Task_status__c,
        type: todo.Type__c,
        eventAt: todo.Event_At__c,
        venue: todo.Event_Venue__c,
        completeBy: todo.Complete_By__c,
        createdAt: todo.Created_at__c,
        listedBy: createdUser[`${todo.Listed_by__c}`]
          ? createdUser[`${todo.Listed_by__c}`]
          : createdUser[`${todo.CreatedById}`],
      };
      filteredToDos.push(filteredToDoObject);
      toDoIds.push(todo.Id);
    });
    const response = { filteredTasks: filteredToDos, taskIds: toDoIds };
    return response;
  }

  /**
   * get resources for the tasks id.
   * @param tasksId ids of the tasks for whom we want the resources.
   * array of resources assigned to the tasks.
   */
  async getResourcesById(tasksId: string[]) {
    const resources: SFResource[] =
      await this.sfService.models.resourceConnections.get(
        'Name, Todo__c, Resource__c, Resource__r.Id, Resource__r.Name, Resource__r.URL__c, Resource__r.Resource_Type__c',
        { Todo__c: tasksId },
      );
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    resources.map((resource) => {
      if (resource.Resource__r) {
        const resourcesObj = {
          Id: resource.Resource__r.Id,
          name: resource.Resource__r.Name,
          url: resource.Resource__r.URL__c,
          type: resource.Resource__r.Resource_Type__c,
        };
        // if a record with a todo task is present then add the object into it or if not create one
        const hashResource = allResource[`${resource.Todo__c}`];
        if (hashResource) {
          hashResource.push(resourcesObj);
          allResource[`${resource.Todo__c}`] = hashResource;
        } else {
          const AllResources = [];
          AllResources.push(resourcesObj);
          allResource[`${resource.Todo__c}`] = AllResources;
        }
      }
    });
    return allResource;
  }

  async getTasksAndResource(tasks: FilteredTasks) {
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
    const resources = await this.getResourcesById(taskIds);

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
   * Sends todo Notification
   * @param SFId SFId of the user to be notified
   * @param title Title of the notification
   * @param message Message of the notification
   * @param todo todo
   */
  async sendTodoNotification(todoNotificationData: TodoNotificationData) {
    let userToBeNotified;
    let data;

    switch (todoNotificationData.notifyTo) {
      case 'assignee': {
        userToBeNotified = todoNotificationData.assigneeId;
        const tasks = await this.getTasks({
          Id: todoNotificationData.todoId,
          Assignee__c: todoNotificationData.assigneeId,
        });
        const tasksAndResources = await this.getTasksAndResource(tasks);
        data = tasksAndResources.data[0];
        break;
      }
      case 'listedBy': {
        userToBeNotified = todoNotificationData.listedById;
        let tasks;
        if (todoNotificationData.groupId) {
          tasks = await this.getTasks({
            Group_Id__c: todoNotificationData.groupId,
            Listed_by__c: todoNotificationData.listedById,
          });
        } else {
          tasks = await this.getTasks({
            Id: todoNotificationData.todoId,
            Assignee__c: todoNotificationData.assigneeId,
          });
        }
        const tasksAndResources = await this.getTasksAndResource(tasks);
        data = tasksAndResources.data[0];
        break;
      }
    }
    const notificationConfig = {
      userId: userToBeNotified,
      title: todoNotificationData.title,
      body: todoNotificationData.message,
      notificationId: uuidv4(),
      notificationData: {
        data,
        type: 'todo',
      },
    };

    return await this.notifier.send(NotificationType.PUSH, notificationConfig);
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
}
