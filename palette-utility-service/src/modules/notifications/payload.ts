// import { Injectable, NotFoundException } from '@nestjs/common';
// import { SfService } from '@gowebknot/palette-salesforce-service';

// @Injectable()
// export class PayloadService {
//   constructor(private sfService: SfService) {}

//   // opportunity notification data object.
//   async GetOpportunityNotificationData(
//     OppId: string,
//     userId: string,
//   ): Promise<any> {
//     if (OppId == null || OppId == '' || userId == null || userId == '') {
//       throw new NotFoundException();
//     }
//     const opportunity = await this.sfService.getAccount('*', { Id: OppId });
//     // not found.
//     if (opportunity.length == 0) {
//       throw new NotFoundException(`Oops, Not Found!`);
//     }import { Injectable, NotFoundException } from '@nestjs/common';
//     import { SFService } from '../salesforce/salesforce.service';
    
//     @Injectable()
//     export class UtilityService {
//       constructor(private sfService: SFService) {}
    
//       // opportunity notification data object.
//       async GetOpportunityNotificationData(
//         OppId: string,
//         userId: string,
//       ): Promise<any> {
//         if (OppId == null || OppId == '' || userId == null || userId == '') {
//           throw new NotFoundException();
//         }
//         const opportunity = await this.sfService.getAccount('*', { Id: OppId });
//         // not found.
//         if (opportunity.length == 0) {
//           throw new NotFoundException(`Oops, Not Found!`);
//         }
    
//         const InstitueObj = {};
//         const interestedUsers = [];
//         const enrolledUsers = [];
    
//         // institute from affiliation.
//         const InstitutesData = await this.sfService.getAffiliation(
//           'hed__Account__c',
//           { hed__Contact__c: userId },
//         );
//         if (InstitutesData.length > 0) {
//           const Institutes = await this.sfService.getAccount('*', {
//             Id: InstitutesData[0].hed__Account__c,
//           });
//           if (Institutes.length > 0) {
//             // mapping institute id : institute name.
//             Institutes.map(ins => {
//               InstitueObj[ins.Id] = ins.Name;
//             });
//           }
//         }
    
//         // interested users in opportunity.
//         const interestedUsersData = await this.sfService.getRecommendation(
//           'Assignee__c',
//           { Event__c: OppId },
//         );
//         if (interestedUsersData.length > 0) {
//           interestedUsersData.map(interested => {
//             interestedUsers.push(interested.Assignee__c);
//           });
//         }
    
//         // enrolled users in opportunity.
//         const enrolledUsersData = await this.sfService.getTodo('Assignee__c', {
//           Opportunity_Id__c: OppId,
//         });
//         if (enrolledUsersData.length > 0) {
//           enrolledUsersData.map(enrolled => {
//             enrolledUsers.push(enrolled.Assignee__c);
//           });
//         }
    
//         const wishListedEvent = await this.sfService.getRecommendation('Id', {
//           Event__c: OppId,
//           Recommended_by__c: userId,
//         });
//         const recomendedEvent = await this.sfService.getRecommendation('Id', {
//           Event__c: OppId,
//         });
//         const enrolledEvent = await this.sfService.getTodo('Id', {
//           Opportunity_Id__c: OppId,
//         });
    
//         const opportunityDataObj = {
//           activity: {
//             activity_id: opportunity[0].Id,
//             name: opportunity[0].Name,
//             category: opportunity[0].Category__c,
//             start_date: opportunity[0].Start_Date__c,
//             end_date: opportunity[0].End_Date__c,
//             description: opportunity[0].Description,
//             venue: opportunity[0].Venue__c,
//             phone: opportunity[0].Phone,
//             shipping_address: opportunity.ShippingAddress
//               ? {
//                   city: opportunity[0].ShippingAddress.city,
//                   country: opportunity[0].ShippingAddress.country,
//                   postal_code: opportunity[0].ShippingAddress.postalCode,
//                   state: opportunity[0].ShippingAddress.state,
//                   street: opportunity[0].ShippingAddress.street,
//                 }
//               : {
//                   city: null,
//                   country: null,
//                   postal_code: null,
//                   state: null,
//                   street: null,
//                 },
//             website: opportunity[0].Website,
//             ListedBy: opportunity[0].Listed_by__c,
//             OpportunityScope: opportunity[0].opportunityScope__c,
//             institute: {
//               Id: opportunity[0].ParentId,
//               name: InstitueObj[opportunity[0].ParentId],
//             },
//             interestedUsers: interestedUsers,
//             enrolledUsers: enrolledUsers,
//           },
//           wishListedEvent: wishListedEvent.length > 0 ? true : false,
//           recomendedEvent: recomendedEvent.length > 0 ? true : false,
//           enrolledEvent: enrolledEvent.length > 0 ? true : false,
//           resources: [],
//         };
//         return opportunityDataObj;
//       }
    
//       // consideration notification data object.
//       async GetConsiderationNotificationData(consId: string): Promise<any> {
//         if (consId == null || consId == '') {
//           throw new NotFoundException();
//         }
//         const considerations = await this.sfService.getRecommendation('*', {
//           Id: consId,
//         });
//         if (considerations.length == 0) {
//           throw new NotFoundException(`Oops, Not Found!`);
//         }
    
//         // considered opportunity details.
//         const opportunity = await this.sfService.getAccount('*', {
//           Id: considerations[0].Event__c,
//         });
    
//         let modStatus = [];
//         // if opportunity modifications exists.
//         if (opportunity[0].Modification__c !== null) {
//           modStatus = await this.sfService.getModification('Status__c', {
//             Id: opportunity[0].Modification__c,
//           });
//         }
    
//         // opportunity recommended by user.
//         const recommendedBy = await this.sfService.getContact('*', {
//           Id: considerations[0].Recommended_by__c,
//         });
    
//         const considerationDataObj = {
//           Id: [considerations[0].Id],
//           event: {
//             Id: opportunity[0].Id,
//             Name: opportunity[0].Name,
//             Description: opportunity[0].Description,
//             Category: opportunity[0].Category__c,
//             StartDate: opportunity[0].Start_Date__c,
//             EndDate: opportunity[0].End_Date__c,
//             Venue: opportunity[0].Venue__c,
//             Phone: opportunity[0].Phone,
//             Website: opportunity[0].Website,
//             OpportunityScope: opportunity[0].opportunityScope__c,
//             RemovalStatus: opportunity[0].Removal_Status__c,
//             ModificationStatus:
//               modStatus.length > 0 ? modStatus[0].Status__c : null,
//           },
//           recommendedBy: [
//             {
//               Id: recommendedBy.length > 0 ? recommendedBy[0].Id : null,
//               Name: recommendedBy.length > 0 ? recommendedBy[0].Name : null,
//               Role:
//                 recommendedBy.length > 0
//                   ? recommendedBy[0].Record_Type_Name__c
//                   : null,
//             },
//           ],
//         };
//         return considerationDataObj;
//       }
    
//       // consideration notification data object.
//       async GetModificationNotificationData(modificationId: string): Promise<any> {
//         if (modificationId == null || modificationId == '') {
//           throw new NotFoundException();
//         }
    
//         const modification = await this.sfService.getModification('*', {
//           Id: modificationId,
//         });
    
//         if (modification.length == 0) {
//           throw new NotFoundException(`Oops, Not Found!`);
//         }
    
//         const modificationDataObj = {
//           Id: modification[0].Id,
//           Name: modification[0].Account_Name__c,
//           description: modification[0].Description__c,
//           venue: modification[0].Venue__c,
//           website: modification[0].Website__c,
//           eventDate: modification[0].Start_Date__c
//             ? new Date(modification[0].Start_Date__c)
//             : null,
//           phone: modification[0].Phone__c,
//           Type: modification[0].Cate__c,
//           expirationDate: modification[0].End_Date__c
//             ? new Date(modification[0].End_Date__c)
//             : null,
//           status: modification[0].Status__c,
//         };
//         return modificationDataObj;
//       }
    
//       // consideration notification data object.
//       async GetTodoNotificationData(todoId: string): Promise<any> {
//         if (todoId == null || todoId == '') {
//           throw new NotFoundException();
//         }
//         // get todo.
//         const todo = await this.sfService.getTodo(
//           'Assignee__r.Profile_Picture__c, Assignee__r.Name, Listed_by__r.Name, *',
//           { Id: todoId },
//         );
//         if (todo.length == 0) {
//           throw new NotFoundException(`Oops, Not Found!`);
//         }
    
//         const resources = await this.sfService.getResourceConnection(
//           'Name, Todo__c, Resource__c, Resource__r.Id, Resource__r.Name, Resource__r.URL__c, Resource__r.Resource_Type__c',
//           { Todo__c: todoId },
//         );
//         // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
//         const allResource = {};
//         resources.map(resource => {
//           if (resource.Resource__r) {
//             const resourcesObj = {
//               Id: resource.Resource__r.Id,
//               name: resource.Resource__r.Name,
//               url: resource.Resource__r.URL__c,
//               type: resource.Resource__r.Resource_Type__c,
//             };
//             // if a record with a todo task is present then add the object into it or if not create one
//             const hashResource = allResource[`${resource.Todo__c}`];
//             if (hashResource) {
//               hashResource.push(resourcesObj);
//               allResource[`${resource.Todo__c}`] = hashResource;
//             } else {
//               const Allresources = [];
//               Allresources.push(resourcesObj);
//               allResource[`${resource.Todo__c}`] = Allresources;
//             }
//           }
//         });
    
//         const todoDataObj = {
//           todo: {
//             Id: todo[0].Id,
//             groupId: todo[0].Group_Id__c,
//             name: todo[0].Name,
//             description: todo[0].Description__c,
//             taskStatus: todo[0].Task_status__c,
//             status: todo[0].Status__c,
//             acceptedStatus: todo[0].Assignee_accepted_status__c,
//             todoScope: todo[0].Todo_Scope__c,
//             type: todo[0].Type__c,
//             eventAt: todo[0].Event_At__c,
//             venue: todo[0].Event_Venue__c,
//             completeBy: todo[0].Complete_By__c,
//             createdAt: todo[0].Created_at__c,
//             listedBy: {
//               Id: todo[0].Listed_by__c,
//               Name: todo[0].Listed_by__r.Name,
//             },
//             Assignee: [
//               {
//                 Id: todo[0].Assignee__c,
//                 todoId: todo[0].Id,
//                 Archived: todo[0].Archived__c,
//                 status: todo[0].Task_status__c,
//                 name: todo[0].Assignee__r.Name,
//                 profilePicture: todo[0].Assignee__r.Profile_Picture__c,
//                 acceptedStatus: todo[0].Assignee_accepted_status__c,
//               },
//             ],
//             opportunity: todo[0].Opportunity_Id__c,
//           },
//           resources: allResource > 0 ? allResource[todo[0].Id] : [],
//         };
//         return todoDataObj;
//       }
    
//       // opportunity approval notification data object.
//       async GetOpportunityApprovalNotificationData(id: string): Promise<any> {
//         if (id == null || id == '') {
//           throw new NotFoundException();
//         }
//         let approvalDataObj = {};
//         if (id == null) {
//           return approvalDataObj;
//         }
    
//         const notification = await this.sfService.getNotifications('*', { Id: id });
//         if (notification.lenght == 0) {
//           return approvalDataObj;
//         }
    
//         const allTodos = await this.sfService.getTodo('Id, Type__c', {});
//         const allTodosObj: any = {};
//         allTodos.map(todo => {
//           allTodosObj[todo.Id] = todo.Type__c;
//         });
    
//         let eventId = null;
//         if (
//           notification[0].Type__c === 'Opportunity Approval Request' ||
//           notification[0].Type__c === 'Opportunity Removal Request'
//         ) {
//           eventId = notification[0].Opportunity__c;
//         } else if (notification[0].Type__c === 'Opportunity Modification Request') {
//           eventId = notification[0].Modification__c;
//         } else if (
//           notification[0].Type__c === 'To-Do Approval Request' ||
//           notification[0].Type__c === 'To-Do Modification Request' ||
//           notification[0].Type__c === 'To-Do Removal Request'
//         ) {
//           eventId = notification[0].Todo__c;
//         }
    
//         approvalDataObj = {
//           Id: notification[0].Id,
//           EventId: eventId,
//           ProfilePicture: notification[0].Notification_By__r
//             ? notification[0].Notification_By__r.Profile_Picture__c
//             : null,
//           CreatorName: notification[0].Notification_By__r
//             ? notification[0].Notification_By__r.Name
//             : null,
//           CreatedAt: notification[0].Created_at__c,
//           TypeName: notification[0].Type__c || null,
//           Title: notification[0].Title__c,
//           OpportunityCategory: notification[0].Event_type__c,
//           IsRead: notification[0].Is_Read__c,
//           TodoType: notification[0].Todo__c
//             ? allTodosObj[notification[0].Todo__c]
//             : null,
//         };
//         return approvalDataObj;
//       }
//     }
    

//     // institute from affiliation.
//     const InstitutesData = await this.sfService.getAffiliation(
//       'hed__Account__c',
//       { hed__Contact__c: userId },
//     );
//     if (InstitutesData.length > 0) {
//       const Institutes = await this.sfService.getAccount('*', {
//         Id: InstitutesData[0].hed__Account__c,
//       });
//       if (Institutes.length > 0) {
//         // mapping institute id : institute name.
//         Institutes.map(ins => {
//           InstitueObj[ins.Id] = ins.Name;
//         });
//       }
//     }

//     // interested users in opportunity.
//     const interestedUsersData = await this.sfService.getRecommendation(
//       'Assignee__c',
//       { Event__c: OppId },
//     );
//     if (interestedUsersData.length > 0) {
//       interestedUsersData.map(interested => {
//         interestedUsers.push(interested.Assignee__c);
//       });
//     }

//     // enrolled users in opportunity.
//     const enrolledUsersData = await this.sfService.getTodo('Assignee__c', {
//       Opportunity_Id__c: OppId,
//     });
//     if (enrolledUsersData.length > 0) {
//       enrolledUsersData.map(enrolled => {
//         enrolledUsers.push(enrolled.Assignee__c);
//       });
//     }

//     const wishListedEvent = await this.sfService.getRecommendation('Id', {
//       Event__c: OppId,
//       Recommended_by__c: userId,
//     });
//     const recomendedEvent = await this.sfService.getRecommendation('Id', {
//       Event__c: OppId,
//     });
//     const enrolledEvent = await this.sfService.getTodo('Id', {
//       Opportunity_Id__c: OppId,
//     });

//     const opportunityDataObj = {
//       activity: {
//         activity_id: opportunity[0].Id,
//         name: opportunity[0].Name,
//         category: opportunity[0].Category__c,
//         start_date: opportunity[0].Start_Date__c,
//         end_date: opportunity[0].End_Date__c,
//         description: opportunity[0].Description,
//         venue: opportunity[0].Venue__c,
//         phone: opportunity[0].Phone,
//         shipping_address: opportunity.ShippingAddress
//           ? {
//               city: opportunity[0].ShippingAddress.city,
//               country: opportunity[0].ShippingAddress.country,
//               postal_code: opportunity[0].ShippingAddress.postalCode,
//               state: opportunity[0].ShippingAddress.state,
//               street: opportunity[0].ShippingAddress.street,
//             }
//           : {
//               city: null,
//               country: null,
//               postal_code: null,
//               state: null,
//               street: null,
//             },
//         website: opportunity[0].Website,
//         ListedBy: opportunity[0].Listed_by__c,
//         OpportunityScope: opportunity[0].opportunityScope__c,
//         institute: {
//           Id: opportunity[0].ParentId,
//           name: InstitueObj[opportunity[0].ParentId],
//         },
//         interestedUsers: interestedUsers,
//         enrolledUsers: enrolledUsers,
//       },
//       wishListedEvent: wishListedEvent.length > 0 ? true : false,
//       recomendedEvent: recomendedEvent.length > 0 ? true : false,
//       enrolledEvent: enrolledEvent.length > 0 ? true : false,
//       resources: [],
//     };
//     return opportunityDataObj;
//   }

//   // consideration notification data object.
//   async GetConsiderationNotificationData(consId: string): Promise<any> {
//     if (consId == null || consId == '') {
//       throw new NotFoundException();
//     }
//     const considerations = await this.sfService.getRecommendation('*', {
//       Id: consId,
//     });
//     if (considerations.length == 0) {
//       throw new NotFoundException(`Oops, Not Found!`);
//     }

//     // considered opportunity details.
//     const opportunity = await this.sfService.getAccount('*', {
//       Id: considerations[0].Event__c,
//     });

//     let modStatus = [];
//     // if opportunity modifications exists.
//     if (opportunity[0].Modification__c !== null) {
//       modStatus = await this.sfService.getModification('Status__c', {
//         Id: opportunity[0].Modification__c,
//       });
//     }

//     // opportunity recommended by user.
//     const recommendedBy = await this.sfService.getContact('*', {
//       Id: considerations[0].Recommended_by__c,
//     });

//     const considerationDataObj = {
//       Id: [considerations[0].Id],
//       event: {
//         Id: opportunity[0].Id,
//         Name: opportunity[0].Name,
//         Description: opportunity[0].Description,
//         Category: opportunity[0].Category__c,
//         StartDate: opportunity[0].Start_Date__c,
//         EndDate: opportunity[0].End_Date__c,
//         Venue: opportunity[0].Venue__c,
//         Phone: opportunity[0].Phone,
//         Website: opportunity[0].Website,
//         OpportunityScope: opportunity[0].opportunityScope__c,
//         RemovalStatus: opportunity[0].Removal_Status__c,
//         ModificationStatus:
//           modStatus.length > 0 ? modStatus[0].Status__c : null,
//       },
//       recommendedBy: [
//         {
//           Id: recommendedBy.length > 0 ? recommendedBy[0].Id : null,
//           Name: recommendedBy.length > 0 ? recommendedBy[0].Name : null,
//           Role:
//             recommendedBy.length > 0
//               ? recommendedBy[0].Record_Type_Name__c
//               : null,
//         },
//       ],
//     };
//     return considerationDataObj;
//   }

//   // consideration notification data object.
//   async GetModificationNotificationData(modificationId: string): Promise<any> {
//     if (modificationId == null || modificationId == '') {
//       throw new NotFoundException();
//     }

//     const modification = await this.sfService.getModification('*', {
//       Id: modificationId,
//     });

//     if (modification.length == 0) {
//       throw new NotFoundException(`Oops, Not Found!`);
//     }

//     const modificationDataObj = {
//       Id: modification[0].Id,
//       Name: modification[0].Account_Name__c,
//       description: modification[0].Description__c,
//       venue: modification[0].Venue__c,
//       website: modification[0].Website__c,
//       eventDate: modification[0].Start_Date__c
//         ? new Date(modification[0].Start_Date__c)
//         : null,
//       phone: modification[0].Phone__c,
//       Type: modification[0].Cate__c,
//       expirationDate: modification[0].End_Date__c
//         ? new Date(modification[0].End_Date__c)
//         : null,
//       status: modification[0].Status__c,
//     };
//     return modificationDataObj;
//   }

//   // consideration notification data object.
//   async GetTodoNotificationData(todoId: string): Promise<any> {
//     if (todoId == null || todoId == '') {
//       throw new NotFoundException();
//     }
//     // get todo.
//     const todo = await this.sfService.getTodo(
//       'Assignee__r.Profile_Picture__c, Assignee__r.Name, Listed_by__r.Name, *',
//       { Id: todoId },
//     );
//     if (todo.length == 0) {
//       throw new NotFoundException(`Oops, Not Found!`);
//     }

//     const resources = await this.sfService.getResourceConnection(
//       'Name, Todo__c, Resource__c, Resource__r.Id, Resource__r.Name, Resource__r.URL__c, Resource__r.Resource_Type__c',
//       { Todo__c: todoId },
//     );
//     // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
//     const allResource = {};
//     resources.map(resource => {
//       if (resource.Resource__r) {
//         const resourcesObj = {
//           Id: resource.Resource__r.Id,
//           name: resource.Resource__r.Name,
//           url: resource.Resource__r.URL__c,
//           type: resource.Resource__r.Resource_Type__c,
//         };
//         // if a record with a todo task is present then add the object into it or if not create one
//         const hashResource = allResource[`${resource.Todo__c}`];
//         if (hashResource) {
//           hashResource.push(resourcesObj);
//           allResource[`${resource.Todo__c}`] = hashResource;
//         } else {
//           const Allresources = [];
//           Allresources.push(resourcesObj);
//           allResource[`${resource.Todo__c}`] = Allresources;
//         }
//       }
//     });

//     const todoDataObj = {
//       todo: {
//         Id: todo[0].Id,
//         groupId: todo[0].Group_Id__c,
//         name: todo[0].Name,
//         description: todo[0].Description__c,
//         taskStatus: todo[0].Task_status__c,
//         status: todo[0].Status__c,
//         acceptedStatus: todo[0].Assignee_accepted_status__c,
//         todoScope: todo[0].Todo_Scope__c,
//         type: todo[0].Type__c,
//         eventAt: todo[0].Event_At__c,
//         venue: todo[0].Event_Venue__c,
//         completeBy: todo[0].Complete_By__c,
//         createdAt: todo[0].Created_at__c,
//         listedBy: {
//           Id: todo[0].Listed_by__c,
//           Name: todo[0].Listed_by__r.Name,
//         },
//         Assignee: [
//           {
//             Id: todo[0].Assignee__c,
//             todoId: todo[0].Id,
//             Archived: todo[0].Archived__c,
//             status: todo[0].Task_status__c,
//             name: todo[0].Assignee__r.Name,
//             profilePicture: todo[0].Assignee__r.Profile_Picture__c,
//             acceptedStatus: todo[0].Assignee_accepted_status__c,
//           },
//         ],
//         opportunity: todo[0].Opportunity_Id__c,
//       },
//       resources: allResource > 0 ? allResource[todo[0].Id] : [],
//     };
//     return todoDataObj;
//   }

//   // opportunity approval notification data object.
//   async GetOpportunityApprovalNotificationData(id: string): Promise<any> {
//     if (id == null || id == '') {
//       throw new NotFoundException();
//     }
//     let approvalDataObj = {};
//     if (id == null) {
//       return approvalDataObj;
//     }

//     const notification = await this.sfService.getNotifications('*', { Id: id });
//     if (notification.lenght == 0) {
//       return approvalDataObj;
//     }

//     const allTodos = await this.sfService.getTodo('Id, Type__c', {});
//     const allTodosObj: any = {};
//     allTodos.map(todo => {
//       allTodosObj[todo.Id] = todo.Type__c;
//     });

//     let eventId = null;
//     if (
//       notification[0].Type__c === 'Opportunity Approval Request' ||
//       notification[0].Type__c === 'Opportunity Removal Request'
//     ) {
//       eventId = notification[0].Opportunity__c;
//     } else if (notification[0].Type__c === 'Opportunity Modification Request') {
//       eventId = notification[0].Modification__c;
//     } else if (
//       notification[0].Type__c === 'To-Do Approval Request' ||
//       notification[0].Type__c === 'To-Do Modification Request' ||
//       notification[0].Type__c === 'To-Do Removal Request'
//     ) {
//       eventId = notification[0].Todo__c;
//     }

//     approvalDataObj = {
//       Id: notification[0].Id,
//       EventId: eventId,
//       ProfilePicture: notification[0].Notification_By__r
//         ? notification[0].Notification_By__r.Profile_Picture__c
//         : null,
//       CreatorName: notification[0].Notification_By__r
//         ? notification[0].Notification_By__r.Name
//         : null,
//       CreatedAt: notification[0].Created_at__c,
//       TypeName: notification[0].Type__c || null,
//       Title: notification[0].Title__c,
//       OpportunityCategory: notification[0].Event_type__c,
//       IsRead: notification[0].Is_Read__c,
//       TodoType: notification[0].Todo__c
//         ? allTodosObj[notification[0].Todo__c]
//         : null,
//     };
//     return approvalDataObj;
//   }
// }
