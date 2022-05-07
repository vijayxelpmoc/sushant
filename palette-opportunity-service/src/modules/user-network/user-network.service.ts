import { SfService } from '@gowebknot/palette-salesforce-service';
import { Notifier, Role } from '@gowebknot/palette-wrapper';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GuardianSubRoles,
  MentorSubRoles,
  ObserverSubRoles,
  StudentSubRoles,
} from '../opportunity/types';
import { AdminService } from './services/adminservice.service';
import { AdvisorService } from './services/advisor.service';
import { ObserverService } from './services/observer.service';
import { ParentService } from './services/parent.service';

@Injectable()
export class UserNetworkService {
  private notifier: Notifier;
  constructor(
    private sfService: SfService,
    private adminService: AdminService,
    private advisorService: AdvisorService,
    private parentService: ParentService,
    private observerService: ObserverService,
  ) {
    this.notifier = new Notifier();
  }

  async getContactsList(userId: string, role: string, instituteId: string) {
    const contacts = [];
    console.log(userId, role);

    // const have_relationship_or_affiliation = checkRelationshipAffiliation(userId);

    // const checkRelationship = await this.sfService.models.relationships.get(
    //   '*',
    //   {
    //     Related_Contact: userId,
    //   },
    //   {},
    //   instituteId,
    // );
    // console.log('first', checkRelationship);

    const checkAffiliation = await this.sfService.models.affiliations.get(
      '*',
      {
        Contact: userId,
      },
      {},
      instituteId,
    );
    // console.log('second', checkAffiliation);

    if (checkAffiliation.length == 0) {
      throw new NotFoundException(`NoAffiliationFound!`);
    }

    switch (role) {
      case 'Student':
        const Roles = []; // all roles
        const getStudentNetwork = await (
          await this.getStudentsContact([userId], Roles, true, instituteId)
        ).contacts;

        return {
          statusCode: 200,
          message: 'Contacts list',
          contacts: getStudentNetwork,
        };

      case 'Administrator':
        const adminNetwork = await this.getAdminContact(
          userId,
          true,
          instituteId,
          [],
        );

        return {
          statusCode: 200,
          message: 'Contacts list',
          contacts: adminNetwork,
        };
      case 'Advisor':
        const advisorNetwork = await this.getAdvisorContact(
          userId,
          true,
          instituteId,
          [],
        );

        return {
          statusCode: 200,
          message: 'Contacts list',
          contacts: advisorNetwork,
        };

      case 'Guardian':
        const guardianNetwork = await this.getGuardianContact(
          userId,
          instituteId,
          true,
          [],
        );
        return {
          statusCode: 200,
          message: 'Contacts list',
          contacts: guardianNetwork,
        };

      case 'Observer':
        const observerNetwork = await this.getObserverContact(
          userId,
          true,
          instituteId,
          [],
        );

        return {
          statusCode: 200,
          message: 'Contacts list',
          contacts: observerNetwork,
        };

      default:
        return {
          statusCode: 200,
          message: `Route does not exist for the specified ${role} persona.`,
        };
    }
  }

  async getOppShareRecipients(
    userId,
    RecordTypeName,
    opportunityId,
    instituteId: string,
  ): Promise<any> {
    // console.log(userId, RecordTypeName, opportunityId, instituteId);

    // RecordTypeName = 'Advisor';
    const considerations = {};
    const todos = [];

    // getting opportunity details
    const opp = await this.sfService.models.accounts.get(
      '*',
      {
        Id: opportunityId,
      },
      {},
      instituteId,
    );
    if (opp.length == 0) {
      throw new NotFoundException('Opportunity Not Found!');
    }

    const visibilityData = ['Hidden', 'Removed'];
    const removalData = ['Rejected', 'Canceled'];
    // if removed.
    if (
      visibilityData.indexOf(opp[0].Visibility) !== -1 ||
      removalData.indexOf(opp[0].Removal_Status) !== -1
    ) {
      throw new NotFoundException(`Opportunity Might Be Removed!`);
    }

    // console.log('opp', opp);

    // institute Id.
    const insId = opp[0].Parent_Account;

    // all recommendations.
    const considerationsList = await this.sfService.models.recommendations.get(
      'Id, Assignee, Accepted',
      {
        Event: opportunityId,
        Recommended_by: userId,
      },
      {},
      instituteId,
    );
    // recommendation mapping
    considerationsList.map((cons) => {
      considerations[cons.Assignee] = cons.Accepted;
    });

    // all todos
    const todosList = await this.sfService.models.todos.get(
      'Id, Assignee',
      {
        Opportunit_Id: opportunityId,
      },
      {},
      instituteId,
    );
    // todos mapping.
    todosList.map((todo) => {
      todos.push(todo.Assignee);
    });

    // for discrete opportunity.
    if (opp[0].opportunityScope === 'Discrete') {
      const getUserOpp = await this.sfService.models.opportunities.get(
        'Id',
        {
          Account: opportunityId,
          Contact: userId,
        },
        {},
        instituteId,
      );
      // only creator can share opportunity.
      if (getUserOpp.length > 0 || opp[0].Listed_by === userId) {
        // share based on role.
        switch (RecordTypeName) {
          // student cannot share discrete opportunity further.
          case 'Student':
            return {
              statusCode: 200,
              message: 'Recipients',
              InstituteID: null,
              data: null,
            };
            break;
          case 'Advisor' || 'Faculty/Staff':
            return {
              statusCode: 200,
              message: 'Recipients',
              InstituteID: `${insId}`,
              data: await this.getAdvisorRelations(
                userId,
                insId,
                instituteId,
                considerations,
                todos,
                'Discrete',
              ),
            };
            break;
          case 'Guardian':
            return {
              statusCode: 200,
              message: 'Recipients',
              InstituteID: `${insId}`,
              data: await this.getGuardianRelations(
                userId,
                insId,
                instituteId,
                considerations,
                todos,
                'Discrete',
              ),
            };
            break;
          case 'Administrator':
            return {
              statusCode: 200,
              message: 'Recipients',
              InstituteID: `${insId}`,
              data: await this.getAdminRelations(
                userId,
                insId,
                instituteId,
                considerations,
                todos,
                'Discrete',
              ),
            };
            break;
          default:
            throw new NotFoundException('Record Type Not Found');
            break;
        }
      }
      return { statusCode: 200, message: 'Not Authorised To share' };
    } else {
      switch (RecordTypeName) {
        case 'Student':
          return {
            statusCode: 200,
            message: 'Recipients',
            InstituteID: `${insId}`,
            data: await this.getStudentsRelations(
              userId,
              insId,
              instituteId,
              considerations,
              todos,
            ),
          };
          break;
        case 'Advisor' || 'Faculty/Staff':
          return {
            statusCode: 200,
            message: 'Recipients',
            InstituteID: `${insId}`,
            data: await this.getAdvisorRelations(
              userId,
              insId,
              instituteId,
              considerations,
              todos,
            ),
          };
          break;
        case 'Guardian':
          return {
            statusCode: 200,
            message: 'Recipients',
            InstituteID: `${insId}`,
            data: await this.getGuardianRelations(
              userId,
              insId,
              instituteId,
              considerations,
              todos,
            ),
          };
          break;
        case 'Administrator':
          return {
            statusCode: 200,
            message: 'Recipients',
            InstituteID: `${insId}`,
            data: await this.getAdminRelations(
              userId,
              insId,
              instituteId,
              considerations,
              todos,
            ),
          };
          break;
        default:
          throw new NotFoundException('Record Type Not Found');
          break;
      }
    }
  }

  async getAdvisorRelations(
    userId: string,
    insId: string,
    instituteId: string,
    considerations?: any,
    todos?: string[],
    scope?: string,
  ) {
    const repIds = [];
    const filteredData = [];
    const studentsId = [];

    repIds.push(userId);

    // getting advisor relationship students.
    const students = await this.sfService.models.relationships.get(
      'Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.dev_uuid, Contact.prod_uuid',
      {
        Related_Contact: userId,
        // Type: MentorSubRoles,
      },
      {},
      instituteId,
    );

    // console.log('students', students);

    for (let stu = 0; stu < students.length; stu++) {
      // checking repetition.
      if (repIds.indexOf(students[stu]['Contact']['Id']) < 0) {
        // storing student Ids.
        studentsId.push(students[stu]['Contact']['Id']);
        // storing student Ids to check repetition.
        repIds.push(students[stu]['Contact']['Id']);
        // data obj
        const filterDataObj = {
          Id: students[stu]['Contact']['Id'],
          name: students[stu]['Contact']['Name'],
          profilePicture: students[stu]['Contact']['Profile_Picture'],
          role: 'Student',
          status:
            students[stu].Contact.dev_uuid === null ||
            students[stu].Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  students[stu]['Contact']['Id'],
                ),
        };
        // storing obj in arr.
        filteredData.push(filterDataObj);
      }
    }
    // for discrete opportunity we can share with students only.
    if (scope === 'Discrete') {
      return filteredData;
    }
    // getting student's relationship.
    for (let i = 0; i < studentsId.length; i++) {
      // getting student's guardians.
      const guardians = await this.sfService.models.relationships.get(
        'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.dev_uuid, Related_Contact.prod_uuid',
        {
          Contact: studentsId[i],
          //   Type: GuardianSubRoles,
        },
        {},
        instituteId,
      );
      for (let gar = 0; gar < guardians.length; gar++) {
        // checking repetition.
        if (repIds.indexOf(guardians[gar]['Related_Contact']['Id']) < 0) {
          // storing ids for repetition check.
          repIds.push(guardians[gar]['Related_Contact']['Id']);
          // data object.
          const filterDataObj = {
            Id: guardians[gar]['Related_Contact']['Id'],
            name: guardians[gar]['Related_Contact']['Name'],
            profilePicture:
              guardians[gar]['Related_Contact']['Profile_Picture'],
            role: 'Guardian',
            status:
              guardians[gar].Related_Contact.dev_uuid === null ||
              guardians[gar].Related_Contact.prod_uuid === null
                ? `Can't Share`
                : await this.getUserStatus(
                    considerations,
                    todos,
                    guardians[gar]['Related_Contact']['Id'],
                  ),
          };
          // strong data object in arr.
          filteredData.push(filterDataObj);
        }
      }
      // getting student's advisors.
      const advisors = await this.sfService.models.relationships.get(
        'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.dev_uuid, Related_Contact.prod_uuid',
        {
          Contact: studentsId[i],
          //   Type: MentorSubRoles,
        },
        {},
        instituteId,
      );
      for (let adv = 0; adv < advisors.length; adv++) {
        // checking repetition.
        if (repIds.indexOf(advisors[adv]['Related_Contact']['Id']) < 0) {
          // storing ids for repetition check.
          repIds.push(advisors[adv]['Related_Contact']['Id']);
          // data object.
          const filterDataObj = {
            Id: advisors[adv]['Related_Contact']['Id'],
            name: advisors[adv]['Related_Contact']['Name'],
            profilePicture: advisors[adv]['Related_Contact']['Profile_Picture'],
            role: 'Advisor',
            status:
              advisors[adv].Related_Contact.dev_uuid === null ||
              advisors[adv].Related_Contact.prod_uuid === null
                ? `Can't Share`
                : await this.getUserStatus(
                    considerations,
                    todos,
                    advisors[adv]['Related_Contact']['Id'],
                  ),
          };
          // strong data object in arr.
          filteredData.push(filterDataObj);
        }
      }
    }
    // getting admins.
    const admins = await this.sfService.models.affiliations.get(
      'Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.dev_uuid, Contact.prod_uuid',
      {
        Organization: insId,
        Role: 'Admin',
      },
      {},
      instituteId,
    );
    for (let i = 0; i < admins.length; i++) {
      if (repIds.indexOf(admins[i]['Contact']['Id']) < 0) {
        repIds.push(admins[i]['Contact']['Id']);
        const filterDataObj = {
          Id: admins[i]['Contact']['Id'],
          name: admins[i]['Contact']['Name'],
          profilePicture: admins[i]['Contact']['Profile_Picture'],
          role: 'Admin',
          status:
            admins[i].Contact.dev_uuid === null ||
            admins[i].Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  admins[i]['Contact']['Id'],
                ),
        };
        filteredData.push(filterDataObj);
      }
    }
    return filteredData;
  }

  async getGuardianRelations(
    userId: string,
    insId: string,
    instituteId: string,
    considerations?: any,
    todos?: string[],
    scope?: string,
  ) {
    const repIds = [],
      filteredData = [];
    const studentsId = [];

    repIds.push(userId);

    const students = await this.sfService.models.relationships.get(
      'Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.dev_uuid, Contact.prod_uuid',
      {
        Related_Contact: userId,
        // Type: GuardianSubRoles,
      },
      {},
      instituteId,
    );
    for (let stu = 0; stu < students.length; stu++) {
      if (repIds.indexOf(students[stu]['Contact']['Id']) < 0) {
        repIds.push(students[stu]['Contact']['Id']);
        studentsId.push(students[stu]['Contact']['Id']);
        const filterDataObj = {
          Id: students[stu]['Contact']['Id'],
          name: students[stu]['Contact']['Name'],
          profilePicture: students[stu]['Contact']['Profile_Picture'],
          role: 'Student',
          status:
            students[stu].Contact.dev_uuid === null ||
            students[stu].Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  students[stu]['Contact']['Id'],
                ),
        };
        filteredData.push(filterDataObj);
      }
    }
    if (scope === 'Discrete') {
      return filteredData;
    }
    for (let i = 0; i < studentsId.length; i++) {
      // getting student guardians
      const guardians = await this.sfService.models.relationships.get(
        'Related_Contact.Id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.dev_uuid, Related_Contact.prod_uuid',
        {
          Contact: studentsId[i],
          //   Type: GuardianSubRoles,
        },
        {},
        instituteId,
      );
      for (let gar = 0; gar < guardians.length; gar++) {
        if (repIds.indexOf(guardians[gar]['Related_Contact']['Id']) < 0) {
          repIds.push(guardians[gar]['Related_Contact']['Id']);
          const filterDataObj = {
            Id: guardians[gar]['Related_Contact']['Id'],
            name: guardians[gar]['Related_Contact']['Name'],
            profilePicture:
              guardians[gar]['Related_Contact']['Profile_Picture'],
            role: 'Guardian',
            status:
              guardians[gar].Related_Contact.dev_uuid === null ||
              guardians[gar].Related_Contact.prod_uuid === null
                ? `Can't Share`
                : await this.getUserStatus(
                    considerations,
                    todos,
                    guardians[gar]['Related_Contact']['Id'],
                  ),
          };
          filteredData.push(filterDataObj);
        }
      }
      const advisors = await this.sfService.models.relationships.get(
        'Related_Contact.Id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.dev_uuid, Related_Contact.prod_uuid',
        {
          Contact: studentsId[i],
          //   Type: MentorSubRoles,
        },
        {},
        instituteId,
      );
      for (let adv = 0; adv < advisors.length; adv++) {
        if (repIds.indexOf(advisors[adv]['Related_Contact']['Id']) < 0) {
          repIds.push(advisors[adv]['Related_Contact']['Id']);
          const filterDataObj = {
            Id: advisors[adv]['Related_Contact']['Id'],
            name: advisors[adv]['Related_Contact']['Name'],
            profilePicture: advisors[adv]['Related_Contact']['Profile_Picture'],
            role: 'Advisor',
            status:
              advisors[adv].Related_Contact.dev_uuid === null ||
              advisors[adv].Related_Contact.prod_uuid === null
                ? `Can't Share`
                : await this.getUserStatus(
                    considerations,
                    todos,
                    advisors[adv]['Related_Contact']['Id'],
                  ),
          };
          filteredData.push(filterDataObj);
        }
      }
    }
    // getting admins
    const admins = await this.sfService.models.affiliations.get(
      'Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.dev_uuid, Contact.prod_uuid',
      {
        Organization: insId,
        Role: 'Admin',
      },
      {},
      instituteId,
    );
    for (let i = 0; i < admins.length; i++) {
      if (repIds.indexOf(admins[i]['Contact']['Id']) < 0) {
        repIds.push(admins[i]['Contact']['Id']);
        const filterDataObj = {
          Id: admins[i]['Contact']['Id'],
          name: admins[i]['Contact']['Name'],
          profilePicture: admins[i]['Contact']['Profile_Picture'],
          role: 'Admin',
          status:
            admins[i].Contact.dev_uuid === null ||
            admins[i].Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  admins[i]['Contact']['Id'],
                ),
        };
        filteredData.push(filterDataObj);
      }
    }
    return filteredData;
  }

  async getAdminRelations(
    userId: string,
    insId: string,
    instituteId: string,
    considerations?: any,
    todos?: string[],
    scope?: string,
  ) {
    const repIds = [];
    const filteredData = [];

    const personas = await this.sfService.models.affiliations.get(
      'Contact.Id, Contact.Name, Contact.Profile_Picture, Role, Contact.dev_uuid, Contact.prod_uuid',
      {
        Organization: insId,
      },
      {},
      instituteId,
    );
    for (let i = 0; i < personas.length; i++) {
      if (
        personas[i]['Contact'] !== null &&
        personas[i].Contact.Id !== userId
      ) {
        if (repIds.indexOf(personas[i]['Contact']['Id']) < 0) {
          if (personas[i]['Role'] !== null) {
            let isNull = true; // assuming uuid is null
            if (process.env.NODE_ENV == 'dev') {
              if (personas[i].Contact.dev_uuid !== null)
                // contradiction
                isNull = false;
            } else if (process.env.NODE_ENV == 'prod') {
              if (personas[i].Contact.prod_uuid !== null)
                // contradiction
                isNull = false;
            }
            // isNull true = > uuid is not there, else it should be false
            repIds.push(personas[i]['Contact']['Id']);
            const filterDataObj = {
              Id: personas[i]['Contact']['Id'],
              name: personas[i]['Contact']['Name'],
              profilePicture: personas[i]['Contact']['Profile_Picture'],
              role: personas[i]['Role'],
              status: isNull
                ? `Can't Share`
                : await this.getUserStatus(
                    considerations,
                    todos,
                    personas[i]['Contact']['Id'],
                  ),
            };
            filteredData.push(filterDataObj);
          }
        }
      }
    }
    return filteredData;
  }

  async getUserStatus(
    considerations: any,
    todos: string[],
    contactId: string,
  ): Promise<string> {
    let status = 'Open';
    if (todos.indexOf(contactId) > -1) {
      status = 'Enrolled';
    } else if (considerations.hasOwnProperty(contactId)) {
      if (considerations[contactId] === 'Pending') {
        status = 'Recommended';
      } else if (considerations[contactId] === 'Declined') {
        status = 'Disinterest';
      }
    }
    return status;
  }

  async getStudentsRelations(
    userId: string,
    insId: string,
    instituteId: string,
    considerations?: any,
    todos?: string[],
    // scope?: string,
  ) {
    const repIds = [];
    const filteredData = [];

    repIds.push(userId);

    // const me = await this.sfService.generics.contacts.get('*', {
    //   Id: userId,
    // });
    // let temp_status = `Can't Share`;
    // if (process.env.NODE_ENV == 'dev') {
    //   if (me[0].dev_uuid !== null) {
    //     temp_status = await this.getUserStatus(considerations, todos, me[0].Id);
    //   }
    // } else {
    //   if (me[0].prod_uuid !== null) {
    //     temp_status = await this.getUserStatus(considerations, todos, me[0].Id);
    //   }
    // }
    // const filteredObj = {
    //   Id: me[0].Id,
    //   name: me[0].Name,
    //   profilePicture: me[0].Profile_Picture,
    //   role: 'Student',
    //   status: temp_status,
    //   // me[0].dev_uuid === null || me[0].prod_uuid === null
    //   //   ? `Can't Share`
    //   //   : await this.getUserStatus(considerations, todos, me[0].Id),
    // };
    // filteredData.push(filteredObj);
    // getting guardians
    const guardians = await this.sfService.models.relationships.get(
      'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.dev_uuid, Related_Contact.prod_uuid',
      {
        Contact: userId,
        // Type: ...GuardianSubRoles,
        // Type: GuardianSubRoles,
      },
      {},
      instituteId,
    );
    for (let i = 0; i < guardians.length; i++) {
      if (repIds.indexOf(guardians[i].Related_Contact.Id) < 0) {
        repIds.push(guardians[i].Related_Contact.Id);
        const filterDataObj = {
          Id: guardians[i].Related_Contact.Id,
          name: guardians[i].Related_Contact.Name,
          profilePicture: guardians[i].Related_Contact.Profile_Picture,
          role: 'Guardian',
          status:
            guardians[i].Related_Contact.dev_uuid === null ||
            guardians[i].Related_Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  guardians[i].Related_Contact.Id,
                ),
        };
        filteredData.push(filterDataObj);
      }
    }
    // getting advisors
    const advisors = await this.sfService.models.relationships.get(
      'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.dev_uuid, Related_Contact.prod_uuid',
      {
        Contact: userId,
        // Type: MentorSubRoles,
      },
      {},
      instituteId,
    );
    for (let i = 0; i < advisors.length; i++) {
      if (repIds.indexOf(advisors[i].Related_Contact.Id) < 0) {
        repIds.push(advisors[i].Related_Contact.Id);
        const filterDataObj = {
          Id: advisors[i].Related_Contact.Id,
          name: advisors[i].Related_Contact.Name,
          profilePicture: advisors[i].Related_Contact.Profile_Picture,
          role: 'Advisor',
          status:
            advisors[i].Related_Contact.dev_uuid === null ||
            advisors[i].Related_Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  advisors[i].Related_Contact.Id,
                ),
        };
        filteredData.push(filterDataObj);
      }
    }
    // getting admins
    const admins = await this.sfService.models.affiliations.get(
      'Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.Primary_Educational_Institution, Contact.dev_uuid, Contact.prod_uuid',
      {
        Organization: insId,
        Role: 'Admin',
      },
      {},
      instituteId,
    );
    for (let i = 0; i < admins.length; i++) {
      if (repIds.indexOf(admins[i]['Contact']['Id']) < 0) {
        repIds.push(admins[i]['Contact']['Id']);
        const filterDataObj = {
          Id: admins[i]['Contact']['Id'],
          name: admins[i]['Contact']['Name'],
          profilePicture: admins[i]['Contact']['Profile_Picture'],
          role: 'Admin',
          status:
            admins[i].Contact.dev_uuid === null ||
            admins[i].Contact.prod_uuid === null
              ? `Can't Share`
              : await this.getUserStatus(
                  considerations,
                  todos,
                  admins[i]['Contact']['Id'],
                ),
        };
        filteredData.push(filterDataObj);
      }
    }
    return filteredData;
  }

  async getStudentsContact(
    userIds: string[],
    roles: string[],
    allRoles: boolean,
    instituteId: string,
  ) {
    const allContacts = [];
    const checkRepetitionIds = [];
    checkRepetitionIds.push(userIds[0]);
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      let parentsObj = [];
      if (allRoles == true) {
        parentsObj = await this.sfService.models.relationships.get(
          'Related_Contact, Type',
          {
            Contact: userId,
          },
          {},
          instituteId,
        );
      } else {
        parentsObj = await this.sfService.models.relationships.get(
          'Related_Contact, Type',
          {
            Contact: userId,
            Type: roles,
          },
          {},
          instituteId,
        );
      }

      if (parentsObj.length > 0) {
        const parentIds = parentsObj.map((parent) => {
          return parent.Related_Contact;
        });

        const temp = await this.sfService.generics.contacts.get(
          '*',
          {
            Id: [...parentIds],
          },
          {},
          instituteId,
        );

        if (temp.length !== 0) {
          temp.map(async (parents) => {
            if (checkRepetitionIds.indexOf(parents.Id) == -1) {
              const obj = {
                id: parents.Id,
                name: parents.Name,
                isRegistered: parents.IsRegisteredOnPalette,
                profilePicture: parents.Profile_Picture,
                relationship: await this.getPersonaRoletype(
                  parents.Record_Type_Name,
                ),
                firebase_uuid:
                  process.env.NODE_ENV === 'prod'
                    ? parents.prod_uuid
                    : parents.dev_uuid,
                createOpportunity: false,
                shareOpportuity: true,
                createTodo: true,
                chat: true,
              };
              checkRepetitionIds.push(parents.Id);
              allContacts.push(obj);
            }
          });
        }
      }

      // doubt
      // const studentProfile = await this.sfService.getStudent(userId);
      const instiDetails = await this.sfService.models.affiliations.get(
        'Name, Id, Contact, Role',
        {
          //   Account: studentProfile.education[0].instituteId,
          Role: ['Admin'],
        },
        {},
        instituteId,
      );

      if (instiDetails.length > 0) {
        const mentorIds = instiDetails.map((mentor) => {
          return mentor.Contact;
        });

        const mentorDetails = await this.sfService.generics.contacts.get(
          'Id, Name, Profile_Picture, dev_uuid, prod_uuid, IsRegisteredOnPalette',
          {
            Id: [...mentorIds],
          },
          {},
          instituteId,
        );
        if (mentorDetails.length > 0) {
          mentorDetails.map((admins) => {
            if (checkRepetitionIds.indexOf(admins.Id) == -1) {
              const obj = {
                id: admins.Id,
                name: admins.Name,
                isRegistered: admins.IsRegisteredOnPalette,
                profilePicture: admins.Profile_Picture,
                relationship: 'Admin',
                firebase_uuid:
                  process.env.NODE_ENV === 'prod'
                    ? admins.prod_uuid
                    : admins.dev_uuid,
                createOpportunity: false,
                shareOpportuity: true,
                createTodo: true,
                chat: true,
              };
              checkRepetitionIds.push(admins.Id);
              allContacts.push(obj);
            }
          });
        }
      }
    }

    return {
      contacts: allContacts,
    };
  }

  async getAdvisorContact(
    userId: string,
    allRoles: boolean,
    instituteId: string,
    roles?: string[],
  ) {
    const advisorContactsList = [];
    const checkRepeatition = [];
    checkRepeatition.push(userId);

    const advisor = await this.advisorService.getAdvisorDetailsStudents(
      userId,
      instituteId,
    );

    if (advisor.data.students.length > 0) {
      const advisorStudents = advisor.data.students;
      const advisorStudentIds = advisorStudents.map((student) => {
        return student.Id;
      });

      const advisorStudentDetails = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...advisorStudentIds],
        },
        {},
        instituteId,
      );

      console.log('fifth', advisorStudentDetails);

      if (advisorStudentDetails.length > 0) {
        advisorStudentDetails.map((student) => {
          if (checkRepeatition.indexOf(student.Id) == -1) {
            if (process.env.NODE_ENV === 'prod') {
              const obj = {
                id: student.Id,
                name: student.Name,
                isRegistered: student.IsRegisteredOnPalette,
                profilePicture: student.Profile_Picture,
                relationship: 'Student',
                firebase_uuid: student.prod_uuid,
                createOpportunity: true,
                shareOpportuity: true,
                createTodo: true,
                chat: true,
              };
              checkRepeatition.push(student.Id);
              advisorContactsList.push(obj);
            } else {
              const obj = {
                id: student.Id,
                name: student.Name,
                isRegistered: student.IsRegisteredOnPalette,
                profilePicture: student.Profile_Picture,
                relationship: 'Student',
                firebase_uuid: student.dev_uuid,
                createOpportunity: true,
                shareOpportuity: true,
                createTodo: true,
                chat: true,
              };
              checkRepeatition.push(student.Id);
              advisorContactsList.push(obj);
            }
          }
        });
      }

      if (advisorStudentIds.length > 0) {
        const guardians = await this.sfService.models.relationships.get(
          'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture',
          {
            Contact: advisorStudentIds,
            Type: GuardianSubRoles,
          },
          {},
          instituteId,
        );
        console.log('sixth', guardians);

        if (guardians.length > 0) {
          const advisorGuardianIds = guardians.map((guardian) => {
            return guardian.Related_Contact.Id;
          });

          const advisorParentDetails =
            await this.sfService.generics.contacts.get(
              'Name, Id, Profile_Picture, IsRegisteredOnPalette',
              {
                Id: [...advisorGuardianIds],
              },
              {},
              instituteId,
            );

          console.log('seventh', advisorParentDetails);

          if (advisorParentDetails.length > 0) {
            advisorParentDetails.map((guardian) => {
              if (checkRepeatition.indexOf(guardian.Id) == -1) {
                if (process.env.NODE_ENV === 'prod') {
                  const obj = {
                    id: guardian.Id,
                    name: guardian.Name,
                    isRegistered: guardian.IsRegisteredOnPalette,
                    profilePicture: guardian.Profile_Picture,
                    relationship: 'Guardian',
                    firebase_uuid: guardian.prod_uuid,
                    createOpportunity: true,
                    shareOpportuity: true,
                    createTodo: true,
                    chat: true,
                  };
                  checkRepeatition.push(guardian.Id);
                  advisorContactsList.push(obj);
                } else {
                  const obj = {
                    id: guardian.Id,
                    name: guardian.Name,
                    isRegistered: guardian.IsRegisteredOnPalette,
                    profilePicture: guardian.Profile_Picture,
                    relationship: 'Guardian',
                    firebase_uuid: guardian.dev_uuid,
                    createOpportunity: true,
                    shareOpportuity: true,
                    createTodo: true,
                    chat: true,
                  };
                  checkRepeatition.push(guardian.Id);
                  advisorContactsList.push(obj);
                }
              }
            });
          }
        }

        const advisorAdvisors = await this.sfService.models.relationships.get(
          'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture',
          {
            Contact: advisorStudentIds,
            Type: MentorSubRoles,
          },
          {},
          instituteId,
        );

        console.log('eight', advisorAdvisors);

        if (advisorAdvisors.length > 0) {
          const advisorAdvisorIds = advisorAdvisors.map((mentor) => {
            return mentor.Related_Contact.Id;
          });

          const advisorAdvisorDetails =
            await this.sfService.generics.contacts.get(
              'Name, Id, Profile_Picture, IsRegisteredOnPalette',
              {
                Id: [...advisorAdvisorIds],
              },
              {},
              instituteId,
            );

          console.log('ninth', advisorAdvisorDetails);

          advisorAdvisorDetails.map((advisor) => {
            if (checkRepeatition.indexOf(advisor.Id) == -1) {
              if (process.env.NODE_ENV === 'prod') {
                const obj = {
                  id: advisor.Id,
                  name: advisor.Name,
                  isRegistered: advisor.IsRegisteredOnPalette,
                  profilePicture: advisor.Profile_Picture,
                  relationship: 'Advisor',
                  createOpportunity: false,
                  firebase_uuid: advisor.prod_uuid,
                  shareOpportuity: true,
                  createTodo: true,
                  chat: true,
                };
                checkRepeatition.push(advisor.Id);
                advisorContactsList.push(obj);
              } else {
                const obj = {
                  id: advisor.Id,
                  name: advisor.Name,
                  isRegistered: advisor.IsRegisteredOnPalette,
                  profilePicture: advisor.Profile_Picture,
                  relationship: 'Advisor',
                  firebase_uuid: advisor.prod_uuid,
                  shareOpportuity: true,
                  createOpportunity: false,
                  createTodo: true,
                  chat: true,
                };
                checkRepeatition.push(advisor.Id);
                advisorContactsList.push(obj);
              }
            }
          });
        }

        const advisorObservers = await this.sfService.models.relationships.get(
          'Related_Contact.id, Related_Contact.Name, Related_Contact.Profile_Picture, Contact.Name',
          {
            Contact: advisorStudentIds,
            Type: ObserverSubRoles,
          },
          {},
          instituteId,
        );
        console.log('tenth', advisorObservers);

        if (advisorObservers.length > 0) {
          const advisorObserverIds = advisorObservers.map((observers) => {
            return observers.Related_Contact.Id;
          });
          // console.log('advisorObserverIds', advisorObserverIds);

          const advisorObserverDetails =
            await this.sfService.generics.contacts.get(
              'Name, Id, Profile_Picture, IsRegisteredOnPalette',
              {
                Id: [...advisorObserverIds],
              },
              {},
              instituteId,
            );

          console.log('elev', advisorObserverDetails);

          advisorObserverDetails.map((observer) => {
            if (checkRepeatition.indexOf(observer.Id) == -1) {
              if (process.env.NODE_ENV === 'prod') {
                const obj = {
                  id: observer.Id,
                  name: observer.Name,
                  isRegistered: observer.IsRegisteredOnPalette,
                  profilePicture: observer.Profile_Picture,
                  relationship: 'Observer',
                  createOpportunity: false,
                  firebase_uuid: observer.prod_uuid,
                  shareOpportuity: true,
                  createTodo: true,
                  chat: true,
                };
                checkRepeatition.push(observer.Id);
                advisorContactsList.push(obj);
              } else {
                const obj = {
                  id: observer.Id,
                  name: observer.Name,
                  isRegistered: observer.IsRegisteredOnPalette,
                  profilePicture: observer.Profile_Picture,
                  relationship: 'Observer',
                  firebase_uuid: observer.prod_uuid,
                  shareOpportuity: true,
                  createOpportunity: false,
                  createTodo: true,
                  chat: true,
                };
                checkRepeatition.push(observer.Id);
                advisorContactsList.push(obj);
              }
            }
          });
        }
      }
    }

    const advisorInstituteDetails =
      await this.sfService.models.affiliations.get(
        '*',
        {
          Affiliation_Type: 'Educational Institution',
          Contact: advisor.data.mentor.Id,
        },
        {},
        instituteId,
      );
    console.log('twel', advisorInstituteDetails);

    const advisorInsti = await this.sfService.models.affiliations.get(
      '*',
      {
        Organization: advisorInstituteDetails[0].Organization,
        Role: ['Admin'],
      },
      {},
      instituteId,
    );
    console.log('thirt', advisorInsti);

    const adminIds = [];

    if (advisorInsti.length > 0) {
      advisorInsti.map((admins) => {
        adminIds.push(admins.Contact);
      });
      const Admins = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...adminIds],
        },
        {},
        instituteId,
      );

      console.log('fourt', Admins);

      Admins.map((admin) => {
        if (checkRepeatition.indexOf(admin.Id) == -1) {
          if (process.env.NODE_ENV === 'prod') {
            const obj = {
              id: admin.Id,
              name: admin.Name,
              isRegistered: admin.IsRegisteredOnPalette,
              profilePicture: admin.Profile_Picture,
              relationship: 'Admin',
              createOpportunity: false,
              firebase_uuid: admin.prod_uuid,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepeatition.push(admin.Id);
            advisorContactsList.push(obj);
          } else {
            const obj = {
              id: admin.Id,
              name: admin.Name,
              isRegistered: admin.IsRegisteredOnPalette,
              profilePicture: admin.Profile_Picture,
              relationship: 'Admin',
              firebase_uuid: admin.prod_uuid,
              shareOpportuity: true,
              createTodo: true,
              createOpportunity: false,
              chat: true,
            };
            checkRepeatition.push(admin.Id);
            advisorContactsList.push(obj);
          }
        }
      });
    }

    return advisorContactsList;
  }

  async getGuardianContact(
    userId: string,
    instituteId: string,
    allRoles?: boolean,
    roles?: string[],
  ) {
    const checkRepetitionIds = [];
    checkRepetitionIds.push(userId);
    const parent = await this.parentService.getParent(userId, instituteId);
    console.log(parent);

    const parentStudentIds = parent.pupils.map((pupil) => {
      return pupil.Id;
    });

    console.log('parentStudentIds', parentStudentIds);

    const parentContactList = [];

    if (parentStudentIds.length > 0) {
      const parentStudentDetails = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...parentStudentIds],
        },
        {},
        instituteId,
      );

      console.log('1', parentStudentDetails);

      parentStudentDetails.map((student) => {
        if (checkRepetitionIds.indexOf(student.Id) == -1) {
          if (process.env.NODE_ENV === 'prod') {
            const obj = {
              id: student.Id,
              name: student.Name,
              isRegistered: student.IsRegisteredOnPalette,
              profilePicture: student.Profile_Picture,
              relationship: 'Student',
              firebase_uuid: student.prod_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitionIds.push(student.Id);
            parentContactList.push(obj);
          } else {
            const obj = {
              id: student.Id,
              name: student.Name,
              isRegistered: student.IsRegisteredOnPalette,
              profilePicture: student.Profile_Picture,
              relationship: 'Student',
              firebase_uuid: student.dev_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitionIds.push(student.Id);
            parentContactList.push(obj);
          }
        }
      });

      const studentInstituteIds = new Array(
        ...new Set(
          parentStudentDetails.map((student) => {
            return student.Primary_Educational_Institution;
          }),
        ),
      );

      const RoleType = new Map();
      const parentGuardians = await this.sfService.models.relationships.get(
        'Type,Related_Contact',
        {
          Contact: [...parentStudentIds],
          // Type: GuardianSubRoles,
        },
        {},
        instituteId,
      );

      console.log('2', parentGuardians);

      parentGuardians.map((event) => {
        RoleType.set(event.Related_Contact, event.Type);
      });
      const temp_parentGuardiansIds = parentGuardians.map((guardian) => {
        return guardian.Related_Contact;
      });

      const hashIds = new Map();
      const parentGuardiansIds = [];
      temp_parentGuardiansIds.map((Id) => {
        if (!hashIds.has(Id) && Id != userId) parentGuardiansIds.push(Id);
        hashIds.set(Id, '1');
      });
      let parentGuardianDetails = [];
      if (parentGuardiansIds.length > 1) {
        parentGuardianDetails = await this.sfService.generics.contacts.get(
          'Id, Name, IsRegisteredOnPalette, Profile_Picture, prod_uuid, dev_uuid ',
          {
            Id: [...parentGuardiansIds],
          },
          {},
          instituteId,
        );

        console.log('3', parentGuardianDetails);

        if (parentGuardianDetails.length > 0) {
          parentGuardianDetails.map(async (guardians) => {
            if (checkRepetitionIds.indexOf(guardians.Id) == -1) {
              if (process.env.NODE_ENV === 'prod') {
                const obj = {
                  id: guardians.Id,
                  name: guardians.Name,
                  isRegistered: guardians.IsRegisteredOnPalette,
                  profilePicture: guardians.Profile_Picture,
                  relationship: await this.getPersonaRoletype(
                    RoleType.get(guardians.Id),
                  ),
                  firebase_uuid: guardians.prod_uuid,
                  createOpportunity: true,
                  shareOpportuity: true,
                  createTodo: true,
                  chat: true,
                };
                checkRepetitionIds.push(guardians.Id);
                parentContactList.push(obj);
              } else {
                const obj = {
                  id: guardians.Id,
                  name: guardians.Name,
                  isRegistered: guardians.IsRegisteredOnPalette,
                  profilePicture: guardians.Profile_Picture,
                  relationship: await this.getPersonaRoletype(
                    RoleType.get(guardians.Id),
                  ),
                  firebase_uuid: guardians.dev_uuid,
                  createOpportunity: true,
                  shareOpportuity: true,
                  createTodo: true,
                  chat: true,
                };
                checkRepetitionIds.push(guardians.Id);
                parentContactList.push(obj);
              }
            }
          });
        }
      }

      const parentStudentInstiDetails = [
        ...(await this.sfService.models.affiliations.get(
          'Name, Id, Contact, Role',
          {
            Organization: [...studentInstituteIds],
            Role: ['Admin'],
          },
          {},
          instituteId,
        )),
      ];

      console.log('4', parentStudentInstiDetails);

      const parentStudentMentorIds = parentStudentInstiDetails.map((mentor) => {
        return mentor.Contact;
      });

      const parentStudentMentorDetails =
        await this.sfService.generics.contacts.get(
          'Id, Name, Profile_Picture, dev_uuid, prod_uuid, IsRegisteredOnPalette, Record_Type_Name',
          {
            Id: [...parentStudentMentorIds],
          },
          {},
          instituteId,
        );

      console.log('5', parentStudentMentorDetails);

      if (parentStudentMentorDetails.length > 0) {
        parentStudentMentorDetails.map(async (admins) => {
          if (checkRepetitionIds.indexOf(admins.Id) == -1) {
            if (process.env.NODE_ENV === 'prod') {
              const obj = {
                id: admins.Id,
                name: admins.Name,
                isRegistered: admins.IsRegisteredOnPalette,
                profilePicture: admins.Profile_Picture,
                relationship: await this.getPersonaRoletype(
                  admins.Record_Type_Name,
                ),
                firebase_uuid: admins.prod_uuid,
                createOpportunity: false,
                shareOpportuity: true,
                createTodo: true,
                chat: admins.prod_uuid !== null ? true : false,
              };
              checkRepetitionIds.push(admins.Id);
              parentContactList.push(obj);
            } else {
              const obj = {
                id: admins.Id,
                name: admins.Name,
                isRegistered: admins.IsRegisteredOnPalette,
                profilePicture: admins.Profile_Picture,
                relationship: await this.getPersonaRoletype(
                  admins.Record_Type_Name,
                ),
                firebase_uuid: admins.dev_uuid,
                createOpportunity: false,
                shareOpportuity: true,
                createTodo: true,
                chat: admins.dev_uuid !== null ? true : false,
              };
              checkRepetitionIds.push(admins.Id);
              parentContactList.push(obj);
            }
          }
        });
      }
    }

    return parentContactList;
  }

  async getObserverContact(
    userId: string,
    allRoles: boolean,
    instituteId: string,
    roles?: string[],
  ) {
    const observerContactList = [];
    // doubt
    const observer = await this.observerService.getObserverDetails(
      userId,
      instituteId,
    );
    const institute = await this.sfService.models.affiliations.get(
      '*',
      {
        Contact: userId,
        Affiliation_Type: 'Educational Institution',
      },
      {},
      instituteId,
    );

    const observerInstituteId = institute[0].Organization;

    const observerInsti = await this.sfService.models.affiliations.get(
      '*',
      {
        Organization: observerInstituteId,
        Role: ['Admin', 'Advisor', 'Observer'],
      },
      {},
      instituteId,
    );

    for (let i = 0; i < observerInsti.length; i++) {
      if (observerInsti[i].Contact.Id !== userId) {
        const temp = await this.sfService.generics.contacts.get(
          '*',
          {
            Id: observerInsti[i].Contact.Id,
          },
          {},
          instituteId,
        );

        if (process.env.NODE_ENV === 'prod') {
          const obj = {
            id: temp[0].Id,
            name: temp[0].Name,
            isRegistered: temp[0].IsRegisteredOnPalette,
            profilePicture: temp[0].Profile_Picture,
            relationship: observerInsti[i].Role,
            createOpportunity: false,
            firebase_uuid: temp[0].prod_uuid,
            shareOpportuity: true,
            createTodo: true,
            chat: true,
          };

          observerContactList.push(obj);
        } else {
          const obj = {
            id: temp[0].Id,
            name: temp[0].Name,
            isRegistered: temp[0].IsRegisteredOnPalette,
            profilePicture: temp[0].Profile_Picture,
            relationship: observerInsti[i].Role,
            firebase_uuid: temp[0].dev_uuid,
            shareOpportuity: true,
            createTodo: true,
            chat: true,
          };

          observerContactList.push(obj);
        }
      }
    }
    const observerStudents = observer.data.students;
    const observerStudentIds = observerStudents.map((student) => {
      return student.Id;
    });

    const observerStudentDetails = await this.sfService.generics.contacts.get(
      '*',
      {
        Id: [...observerStudentIds],
      },
      {},
      instituteId,
    );

    for (let i = 0; i < observerStudentDetails.length; i++) {
      if (process.env.NODE_ENV === 'prod') {
        const obj = {
          id: observerStudentDetails[i].Id,
          name: observerStudentDetails[i].Name,
          isRegistered: observerStudentDetails[i].IsRegisteredOnPalette,
          profilePicture: observerStudentDetails[i].Profile_Picture,
          relationship: 'Student',
          firebase_uuid: observerStudentDetails[i].prod_uuid,
          createOpportunity: true,
          shareOpportuity: true,
          createTodo: true,
          chat: true,
        };

        observerContactList.push(obj);
      } else {
        const obj = {
          id: observerStudentDetails[i].Id,
          name: observerStudentDetails[i].Name,
          isRegistered: observerStudentDetails[i].IsRegisteredOnPalette,
          profilePicture: observerStudentDetails[i].Profile_Picture,
          relationship: 'Student',
          firebase_uuid: observerStudentDetails[i].dev_uuid,
          createOpportunity: true,
          shareOpportuity: true,
          createTodo: true,
          chat: true,
        };

        observerContactList.push(obj);
      }
    }

    const observerGuardians = await this.sfService.models.relationships.get(
      'Related_Contact.Id, Related_Contact.Name, Related_Contact.Profile_Picture',
      {
        Contact: [...observerStudentIds],
        Type: GuardianSubRoles,
      },
      {},
      instituteId,
    );

    const observerGuardianIds = observerGuardians.map((guardian) => {
      return guardian.Related_Contact.Id;
    });

    const observerGuardianDetails = await this.sfService.generics.contacts.get(
      '*',
      {
        Id: [...observerGuardianIds],
      },
      {},
      instituteId,
    );

    for (let i = 0; i < observerGuardianDetails.length; i++) {
      if (process.env.NODE_ENV === 'prod') {
        const obj = {
          id: observerGuardianDetails[i].Id,
          name: observerGuardianDetails[i].Name,
          isRegistered: observerGuardianDetails[i].IsRegisteredOnPalette,
          profilePicture: observerGuardianDetails[i].Profile_Picture,
          relationship: 'Guardian',
          firebase_uuid: observerGuardianDetails[i].prod_uuid,
          createOpportunity: true,
          shareOpportuity: true,
          createTodo: true,
          chat: true,
        };
        observerContactList.push(obj);
      } else {
        const obj = {
          id: observerGuardianDetails[i].Id,
          name: observerGuardianDetails[i].Name,
          isRegistered: observerGuardianDetails[i].IsRegisteredOnPalette,
          profilePicture: observerGuardianDetails[i].Profile_Picture,
          relationship: 'Guardian',
          firebase_uuid: observerGuardianDetails[i].dev_uuid,
          createOpportunity: true,
          shareOpportuity: true,
          createTodo: true,
          chat: true,
        };
        observerContactList.push(obj);
      }
    }

    return observerContactList;
  }

  async getAdminContact(
    userId: string,
    allRoles: boolean,
    instituteId: string,
    roles?: string[],
  ) {
    const adminDetails = await this.adminService.getAdminInstituteDetails(
      userId,
      instituteId,
    );
    // console.log('adminDetails', adminDetails.data);

    const checkRepetitonIds = [];
    checkRepetitonIds.push(userId);
    const allOtherAdminsId = adminDetails.data.admins.map((event) => {
      return event.Id;
    });
    const adminContactsList = [];
    // console.log('allOtherAdminsId', allOtherAdminsId);

    if (allOtherAdminsId.length > 0) {
      const allOtherAdminsContact = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...allOtherAdminsId],
        },
        {},
        instituteId,
      );

      // console.log('eight', allOtherAdminsContact[0]);

      for (let i = 0; i < allOtherAdminsContact.length; i++) {
        if (checkRepetitonIds.indexOf(allOtherAdminsContact[i].Id) == -1) {
          const obj = {
            id: allOtherAdminsContact[i].Id,
            name: allOtherAdminsContact[i].Name,
            isRegistered: allOtherAdminsContact[i].IsRegisteredOnPalette,
            profilePicture: allOtherAdminsContact[i].Profile_Picture,
            relationship: 'Admin',
            firebase_uuid:
              process.env.NODE_ENV === 'prod'
                ? allOtherAdminsContact[i].prod_uuid
                : allOtherAdminsContact[i].dev_uuid,
            createOpportunity: true,
            shareOpportuity: true,
            createTodo: true,
            chat: true,
          };
          checkRepetitonIds.push(allOtherAdminsContact[i].Id);
          adminContactsList.push(obj);
        }
      }
    }

    const adminStudentsList = adminDetails.data.students;
    if (adminStudentsList.length > 0) {
      const adminStudentIds = adminStudentsList.map((student) => {
        return student.Id;
      });
      const adminStudentDetails = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...adminStudentIds],
        },
        {},
        instituteId,
      );
      // console.log('ninth', adminStudentDetails[0]);

      for (let i = 0; i < adminStudentsList.length; i++) {
        if (checkRepetitonIds.indexOf(adminStudentDetails[i].Id) == -1) {
          if (process.env.NODE_ENV === 'prod') {
            const obj = {
              id: adminStudentDetails[i].Id,
              name: adminStudentDetails[i].Name,
              isRegistered: adminStudentDetails[i].IsRegisteredOnPalette,
              profilePicture: adminStudentDetails[i].Profile_Picture,
              relationship: 'Student',
              firebase_uuid: adminStudentDetails[i].prod_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminStudentDetails[i].Id);
            adminContactsList.push(obj);
          } else {
            const obj = {
              id: adminStudentDetails[i].Id,
              name: adminStudentDetails[i].Name,
              isRegistered: adminStudentDetails[i].IsRegisteredOnPalette,
              profilePicture: adminStudentDetails[i].Profile_Picture,
              relationship: 'Student',
              firebase_uuid: adminStudentDetails[i].dev_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminStudentDetails[i].Id);
            adminContactsList.push(obj);
          }
        }
      }
    }

    const adminMentorsList = adminDetails.data.mentors;

    if (adminMentorsList.length > 0) {
      const adminMentorIds = adminMentorsList.map((mentor) => {
        return mentor.Id;
      });

      const adminMentorDetails = await this.sfService.generics.contacts.get(
        'Id, Name, Profile_Picture, IsRegisteredOnPalette, prod_uuid, dev_uuid, Record_Type_Name',
        {
          Id: [...adminMentorIds],
        },
        {},
        instituteId,
      );

      // console.log('tenth', adminMentorDetails);

      for (
        let i = 0;
        i < adminMentorsList.length && adminMentorDetails[i];
        i++
      ) {
        // console.log(i);

        if (checkRepetitonIds.indexOf(adminMentorDetails[i].Id) == -1) {
          if (process.env.NODE_ENV === 'prod') {
            const obj = {
              id: adminMentorDetails[i].Id,
              name: adminMentorDetails[i].Name,
              isRegistered: adminMentorDetails[i].IsRegisteredOnPalette,
              profilePicture: adminMentorDetails[i].Profile_Picture,
              relationship: adminMentorDetails[i].Record_Type_Name,
              firebase_uuid: adminMentorDetails[i].prod_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminMentorDetails[i].Id);
            adminContactsList.push(obj);
          } else {
            const obj = {
              id: adminMentorDetails[i].Id,
              name: adminMentorDetails[i].Name,
              isRegistered: adminMentorDetails[i].IsRegisteredOnPalette,
              profilePicture: adminMentorDetails[i].Profile_Picture,
              relationship: adminMentorDetails[i].Record_Type_Name,
              firebase_uuid: adminMentorDetails[i].dev_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminMentorDetails[i].Id);
            adminContactsList.push(obj);
          }
        }
      }
    }

    const adminParentsList = adminDetails.data.parents;
    if (adminParentsList.length > 0) {
      const adminParentIds = adminParentsList.map((parent) => {
        return parent.Id;
      });
      const adminParentsDetails = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...adminParentIds],
        },
        {},
        instituteId,
      );

      // console.log('eleventh', adminParentsDetails);

      for (let i = 0; i < adminParentsList.length; i++) {
        if (checkRepetitonIds.indexOf(adminParentsDetails[i].Id) == -1) {
          if (process.env.NODE_ENV === 'prod') {
            const obj = {
              id: adminParentsDetails[i].Id,
              name: adminParentsDetails[i].Name,
              isRegistered: adminParentsDetails[i].IsRegisteredOnPalette,
              profilePicture: adminParentsDetails[i].Profile_Picture,
              relationship: 'Guardian',
              firebase_uuid: adminParentsDetails[i].prod_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminParentsDetails[i].Id);
            adminContactsList.push(obj);
          } else {
            const obj = {
              id: adminParentsDetails[i].Id,
              name: adminParentsDetails[i].Name,
              isRegistered: adminParentsDetails[i].IsRegisteredOnPalette,
              profilePicture: adminParentsDetails[i].Profile_Picture,
              relationship: 'Guardian',
              firebase_uuid: adminParentsDetails[i].dev_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminParentsDetails[i].Id);
            adminContactsList.push(obj);
          }
        }
      }
    }

    const adminObserverssList = adminDetails.data.observers;
    if (adminObserverssList.length > 0) {
      const adminObserverIds = adminObserverssList.map((observer) => {
        return observer.Id;
      });

      const adminObserverDetails = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...adminObserverIds],
        },
        {},
        instituteId,
      );

      // console.log('twelveth', adminObserverDetails);

      for (let i = 0; i < adminObserverssList.length; i++) {
        if (checkRepetitonIds.indexOf(adminObserverDetails[i].Id) == -1) {
          if (process.env.NODE_ENV === 'prod') {
            const obj = {
              id: adminObserverDetails[i].Id,
              name: adminObserverDetails[i].Name,
              isRegistered: adminObserverDetails[i].IsRegisteredOnPalette,
              profilePicture: adminObserverDetails[i].Profile_Picture,
              relationship: 'Observer',
              firebase_uuid: adminObserverDetails[i].prod_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminObserverDetails[i].Id);
            adminContactsList.push(obj);
          } else {
            const obj = {
              id: adminObserverDetails[i].Id,
              name: adminObserverDetails[i].Name,
              isRegistered: adminObserverDetails[i].IsRegisteredOnPalette,
              profilePicture: adminObserverDetails[i].Profile_Picture,
              relationship: 'Observer',
              firebase_uuid: adminObserverDetails[i].dev_uuid,
              createOpportunity: true,
              shareOpportuity: true,
              createTodo: true,
              chat: true,
            };
            checkRepetitonIds.push(adminObserverDetails[i].Id);
            adminContactsList.push(obj);
          }
        }
      }
    }

    return adminContactsList;
  }

  async getPersonaRoletype(role: string) {
    const guardiansRolestype = GuardianSubRoles;
    const advisorRolestype = MentorSubRoles;
    const studentRolestype = StudentSubRoles;
    const observerRolestype = ObserverSubRoles;
    const adminRolestype = ['Admin', 'Administrator'];

    if (guardiansRolestype.indexOf(role) > -1) {
      role = 'Guardian';
    } else if (advisorRolestype.indexOf(role) > -1) {
      role = 'Advisor';
    } else if (studentRolestype.indexOf(role) > -1) {
      role = 'Student';
    } else if (observerRolestype.indexOf(role) > -1) {
      role = 'Observer';
    } else if (adminRolestype.indexOf(role) > -1) {
      role = 'Admin';
    }
    return role;
  }
}
