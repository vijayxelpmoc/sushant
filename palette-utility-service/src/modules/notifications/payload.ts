import { Injectable, NotFoundException } from '@nestjs/common';
import { SfService } from '@gowebknot/palette-salesforce-service';

@Injectable()
export class PayloadService {
  constructor(private sfService: SfService) {}

  // opportunity notification data object.
  async GetOpportunityNotificationData(
    OppId: string,
    userId: string,
    instituteId: string,
    programId: string
  ): Promise<any> {
    if (OppId == null || OppId == '' || userId == null || userId == '') {
      throw new NotFoundException();
    }
    const opportunity = await this.sfService.models.accounts.get('*', { 
        Id: OppId,
        Program: programId, 
      }, 
      {},
      instituteId
    );

    if (opportunity.length == 0) {
      throw new NotFoundException(`Oops, Not Found!`);
    }

    const InstitueObj = {};
    const interestedUsers = [];
    const enrolledUsers = [];

    // institute from affiliation.
    const InstitutesData = await this.sfService.models.affiliations.get(
      'Organization',
      { 
        Contact: userId, 
        Organization: programId,
      },
      {},
      instituteId
    );
    if (InstitutesData.length > 0) {
      const Institutes = await this.sfService.models.accounts.get('*', {
        Id: InstitutesData[0].Organization,
        Program: programId, 
      }, {}, instituteId);
      if (Institutes.length > 0) {
        // mapping institute id : institute name.
        Institutes.map(ins => {
          InstitueObj[ins.Id] = ins.Account_Name;
        });
      }
    }

    // interested users in opportunity.
    const interestedUsersData = await this.sfService.models.recommendations.get(
      'Assignee',
      { 
        Event: OppId,
        Program: programId,
      },
      {},
      instituteId
    );
    if (interestedUsersData.length > 0) {
      interestedUsersData.map(interested => {
        interestedUsers.push(interested.Assignee);
      });
    }

    // enrolled users in opportunity.
    const enrolledUsersData = await this.sfService.models.todos.get('Assignee', {
        Opportunit_Id: OppId,
        Program: programId, 
      }, 
      {}, 
      instituteId
    );
    if (enrolledUsersData.length > 0) {
      enrolledUsersData.map(enrolled => {
        enrolledUsers.push(enrolled.Assignee);
      });
    }

    const wishListedEvent = await this.sfService.models.recommendations.get('Id', {
      Event: OppId,
      Recommended_by: userId,
      Program: programId, 
    }, {}, instituteId);
    const recomendedEvent = await this.sfService.models.recommendations.get('Id', {
      Event: OppId,
      Program: programId, 
    }, {}, instituteId);
    const enrolledEvent = await this.sfService.models.todos.get('Id', {
        Opportunit_Id: OppId,
        Program: programId, 
    }, {}, instituteId);

    const opportunityDataObj = {
      activity: {
        activity_id: opportunity[0].Id,
        name: opportunity[0].Account_Name,
        category: opportunity[0].Category,
        start_date: opportunity[0].Start_Date,
        end_date: opportunity[0].End_Date,
        description: opportunity[0].Description,
        venue: opportunity[0].Venue,
        phone: opportunity[0].Phone,
        shipping_address: opportunity.ShippingAddress
          ? {
              city: opportunity[0].ShippingAddress.city,
              country: opportunity[0].ShippingAddress.country,
              postal_code: opportunity[0].ShippingAddress.postalCode,
              state: opportunity[0].ShippingAddress.state,
              street: opportunity[0].ShippingAddress.street,
            }
          : {
              city: null,
              country: null,
              postal_code: null,
              state: null,
              street: null,
            },
        website: opportunity[0].Website,
        ListedBy: opportunity[0].Listed_by,
        OpportunityScope: opportunity[0].opportunityScope,
        institute: {
          Id: opportunity[0].Parent_Account,
          name: InstitueObj[opportunity[0].Parent_Account],
        },
        interestedUsers: interestedUsers,
        enrolledUsers: enrolledUsers,
      },
      wishListedEvent: wishListedEvent.length > 0 ? true : false,
      recomendedEvent: recomendedEvent.length > 0 ? true : false,
      enrolledEvent: enrolledEvent.length > 0 ? true : false,
      resources: [],
    };
    return opportunityDataObj;
  }

  // consideration notification data object.
  async GetConsiderationNotificationData(consId: string, instituteId: string, programId: string): Promise<any> {
    if (consId == null || consId == '') {
      throw new NotFoundException();
    }
    const considerations = await this.sfService.models.recommendations.get('*', {
      Id: consId,
      Program: programId, 
    }, {}, instituteId);
    if (considerations.length == 0) {
      throw new NotFoundException(`Oops, Not Found!`);
    }

    // considered opportunity details.
    const opportunity = await this.sfService.models.accounts.get('*', {
      Id: considerations[0].Event,
      Program: programId, 
    }, {}, instituteId);

    let modStatus = [];
    // if opportunity modifications exists.
    if (opportunity[0].Modification__c !== null) {
      modStatus = await this.sfService.models.modifications.get('Status', {
        Id: opportunity[0].Modification,
        Program: programId, 
      }, {}, instituteId);
    }

    // opportunity recommended by user.
    const recommendedBy = await this.sfService.generics.contacts.get('*', {
      Id: considerations[0].Recommended_by,
      Primary_Educational_Institution: programId,
    }, {}, instituteId);

    const considerationDataObj = {
      Id: [considerations[0].Id],
      event: {
        Id: opportunity[0].Id,
        Name: opportunity[0].Account_Name,
        Description: opportunity[0].Description,
        Category: opportunity[0].Category,
        StartDate: opportunity[0].Start_Date,
        EndDate: opportunity[0].End_Date,
        Venue: opportunity[0].Venue,
        Phone: opportunity[0].Phone,
        Website: opportunity[0].Website,
        OpportunityScope: opportunity[0].opportunityScope,
        RemovalStatus: opportunity[0].Removal_Status,
        ModificationStatus:
          modStatus.length > 0 ? modStatus[0].Status : null,
      },
      recommendedBy: [
        {
          Id: recommendedBy.length > 0 ? recommendedBy[0].Id : null,
          Name: recommendedBy.length > 0 ? recommendedBy[0].Name : null,
          Role:
            recommendedBy.length > 0
              ? recommendedBy[0].Record_Type_Name
              : null,
        },
      ],
    };
    return considerationDataObj;
  }

  // consideration notification data object.
  async GetModificationNotificationData(modificationId: string, instituteId: string, programId: string): Promise<any> {
    if (!modificationId) {
      throw new NotFoundException();
    }

    const modification = await this.sfService.models.modifications.get('*', {
      Id: modificationId,
      Program: programId, 
    }, {}, instituteId);

    if (modification.length == 0) {
      throw new NotFoundException(`Oops, Not Found!`);
    }

    const modificationDataObj = {
      Id: modification[0].Id,
      Name: modification[0].Account_Name,
      description: modification[0].Description,
      venue: modification[0].Venue,
      website: modification[0].Website,
      eventDate: modification[0].Start_Date
        ? new Date(modification[0].Start_Date)
        : null,
      phone: modification[0].Phone,
      Type: modification[0].Category,
      expirationDate: modification[0].End_Date
        ? new Date(modification[0].End_Date)
        : null,
      status: modification[0].Status,
    };
    return modificationDataObj;
  }

  // consideration notification data object.
  async GetTodoNotificationData(todoId: string, instituteId: string, programId: string): Promise<any> {
    if (todoId == null || todoId == '') {
      throw new NotFoundException();
    }
    
    // get todo.
    const todo = await this.sfService.models.todos.get(
      'Assignee.Id, Assignee.Profile_Picture, Assignee.Name, Listed_by.Id, Listed_by.Name, Id, Group_Id, To_do, Description, Task_Status, Status, Assignee_accepted_status, Todo_Scope, Type, Event_At, Event_Venue, Complete_By, Created_at, Archived, Opportunit_Id',
      { 
        Id: todoId,
        Program: programId,
      },
      {},
      instituteId
    );

    if (todo.length == 0) {
      throw new NotFoundException();
    }

    const resources = await this.sfService.models.resourceConnections.get(
      'Resource_Connection_Name, Todo, Resource.Id, Resource.Resource_Name, Resource.URL, Resource.Resource_Type',
      { 
        Todo: todoId,
        Program: programId,
      },
      {},
      instituteId
    );

    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    if (resources.lenght > 0) {
      resources.map(resource => {
        if (resource.Resource) {
          const resourcesObj = {
            Id: resource.Resource.Id,
            name: resource.Resource.Resource_Name,
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
    }

    const todoDataObj = {
      todo: {
        Id: todo[0].Id,
        groupId: todo[0].Group_Id,
        name: todo[0].To_do,
        description: todo[0].Description,
        taskStatus: todo[0].Task_Status,
        status: todo[0].Status,
        acceptedStatus: todo[0].Assignee_accepted_status,
        todoScope: todo[0].Todo_Scope,
        type: todo[0].Type,
        eventAt: todo[0].Event_At,
        venue: todo[0].Event_Venue,
        completeBy: todo[0].Complete_By,
        createdAt: todo[0].Created_at,
        listedBy: {
          Id: todo[0].Listed_by.Id,
          Name: todo[0].Listed_by.Name,
        },
        Assignee: [
          {
            Id: todo[0].Assignee.Id,
            todoId: todo[0].Id,
            Archived: todo[0].Archived,
            status: todo[0].Task_Status,
            name: todo[0].Assignee.Name,
            profilePicture: todo[0].Assignee.Profile_Picture,
            acceptedStatus: todo[0].Assignee_accepted_status,
          },
        ],
        opportunity: todo[0].Opportunit_Id,
      },
      resources: allResource.hasOwnProperty(todo[0].Id) ? allResource[todo[0].Id] : [],
    };
    return todoDataObj;
  }

  // opportunity approval notification data object.
  async GetOpportunityApprovalNotificationData(id: string, instituteId: string, programId: string): Promise<any> {
    if (id == null || id == '' || id == undefined) {
      throw new NotFoundException();
    }

    let approvalDataObj = {};
    const notification = await this.sfService.models.notifications.get(
      'Id, Notification_By.Profile_Picture, Notification_By.Name, Created_at, Type, Title, Event_type, Is_Read, To_Do', 
      { 
        Id: id,
        Program: programId,
      }, 
      {}, 
      instituteId
    );
    if (notification.lenght == 0) {
      return approvalDataObj;
    }

    const allTodos = await this.sfService.models.todos.get('Id, Type', { Program: programId }, {}, instituteId);
    const allTodosObj: any = {};
    allTodos.map(todo => {
      allTodosObj[todo.Id] = todo.Type;
    });

    let eventId = null;
    if (
      notification[0].Type === 'Opportunity Approval Request' ||
      notification[0].Type === 'Opportunity Removal Request'
    ) {
      eventId = notification[0].Opportunity;
    } else if (notification[0].Type === 'Opportunity Modification Request') {
      eventId = notification[0].Modification;
    } else if (
      notification[0].Type === 'To-Do Approval Request' ||
      notification[0].Type === 'To-Do Modification Request' ||
      notification[0].Type === 'To-Do Removal Request'
    ) {
      eventId = notification[0].To_Do;
    }

    approvalDataObj = {
      Id: notification[0].Id,
      EventId: eventId,
      ProfilePicture: notification[0].Notification_By
        ? notification[0].Notification_By.Profile_Picture
        : null,
      CreatorName: notification[0].Notification_By
        ? notification[0].Notification_By.Name
        : null,
      CreatedAt: notification[0].Created_at,
      TypeName: notification[0].Type || null,
      Title: notification[0].Title,
      OpportunityCategory: notification[0].Event_type,
      IsRead: notification[0].Is_Read,
      TodoType: notification[0].To_Do
        ? allTodosObj[notification[0].To_Do]
        : null,
    };
    return approvalDataObj;
  }
}
