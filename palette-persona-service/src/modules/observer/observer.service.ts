import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Errors, Responses } from '@src/constants';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { UpdateSfObserverDto } from './dtos';
import {
  MentorDetails,
  MentorSubRoles,
  ObserverBEResponse,
  ObserverInstitute,
  ObserverSFInstitutesList,
  ObserverSubRoles,
  ObserverUpdateResponse,
  SFMentorStudents,
  SFMentorStudentsInstitute,
  SFObserverContact,
  SFStudentsObserver,
  StudentDetails,
} from './types';
@Injectable()
export class ObserverService {
  constructor(private sfService: SfService) {}

  /** sends admin details on the basis of the id
   *  @param {string} id - The id of the admin
   * @returns {Object} AdminBEResponse Interface
   */
  async getObserver(
    id: string,
    instituteId: string,
  ): Promise<ObserverBEResponse> {
    const responseData: SFObserverContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Profile_Picture',
        {
          Id: id,
        },
        {},
        instituteId,
      );

    const {
      Id,
      Name,
      Phone,
      Palette_Email,
      MailingCity,
      MailingCountry,
      MailingState,
      MailingPostalCode,
      MailingStreet,
      Facebook,
      Whatsapp,
      Instagram,
      Website,
      Website_Title,
      Github,
      LinkedIn_URL,
      Profile_Picture,
    } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`Observer with ID "${id}" not found`);
    }

    const institutesListRaw: ObserverSFInstitutesList[] =
      await this.sfService.models.affiliations.get(
        'Id, Affiliation_Name, Organization, Affiliation_Type, Contact, End_Date, Start_Date, Role, Tenure, Description, Designation',
        {
          Contact: id,
        },
        {},
        instituteId,
      );

    const institutesList: ObserverInstitute[] =
      await this.observerInstituteMapping(institutesListRaw, instituteId);

    const ObserverData: ObserverBEResponse = {
      Id: Id,
      name: Name,
      phone: Phone,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      institutes: institutesList,
      mailingCity: MailingCity,
      mailingCountry: MailingCountry,
      mailingState: MailingState,
      mailingStreet: MailingStreet,
      mailingPostalCode: MailingPostalCode,
      facebook_link: Facebook,
      whatsapp_link: Whatsapp,
      instagram_link: Instagram,
      website_link: Website,
      website_Title: Website_Title,
      github_link: Github,
      linkedin_link: LinkedIn_URL,
    };

    const response: any = {
      statusCode: 200,
      message: Responses.OBSERVER_DATA,
      Data: ObserverData,
    };
    return response;
  }

  async observerInstituteMapping(
    institutesListRaw: ObserverSFInstitutesList[],
    instituteId: string,
  ): Promise<ObserverInstitute[]> {
    return await Promise.all(
      institutesListRaw.map(async (c) => {
        const name = await this.sfService.models.accounts.get(
          'Account_Name',
          {
            Id: c.Organization,
          },
          {},
          instituteId,
        );
        const instituteObj = {
          institute_id: c.Id,
          institute_name: name[0].Account_Name,
          designation: c.Designation,
        };
        return instituteObj;
      }),
    );
  }

  async update(
    id: string,
    updateSfObserverDto: UpdateSfObserverDto,
    instituteId: string,
  ) {
    const responseData: SFObserverContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL',
        {
          Id: id,
        },
        {},
        instituteId,
      );

    const { Id } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`Observer with #${id} not found`);
    }

    const updateObj: any = {};

    if (updateSfObserverDto.hasOwnProperty('facebook_link')) {
      const { facebook_link } = updateSfObserverDto;
      updateObj.Facebook = facebook_link;
    }

    if (updateSfObserverDto.hasOwnProperty('whatsapp_link')) {
      const { whatsapp_link } = updateSfObserverDto;
      updateObj.Whatsapp = whatsapp_link;
    }

    if (updateSfObserverDto.hasOwnProperty('instagram_link')) {
      const { instagram_link } = updateSfObserverDto;
      updateObj.Instagram = instagram_link;
    }

    if (updateSfObserverDto.hasOwnProperty('github_link')) {
      const { github_link } = updateSfObserverDto;
      updateObj.Github = github_link;
    }

    if (updateSfObserverDto.hasOwnProperty('linkedin_link')) {
      const { linkedin_link } = updateSfObserverDto;
      updateObj.LinkedIn_URL = linkedin_link;
    }

    if (updateSfObserverDto.hasOwnProperty('website_link')) {
      const { website_link } = updateSfObserverDto;
      updateObj.Website = website_link;
    }

    if (updateSfObserverDto.hasOwnProperty('website_Title')) {
      const { website_Title } = updateSfObserverDto;
      updateObj.Website_Title = website_Title;
    }

    const updateUser: ObserverUpdateResponse =
      await this.sfService.generics.contacts.update(Id, updateObj, instituteId);

    if (updateUser.id && updateUser.success) {
      return { status: 200, message: Responses.OBSERVER_SAVED };
    } else {
      throw new BadRequestException(Errors.OBSERVER_SAVE_ERROR);
    }
  }

  /** sends observer details on the basis of the id
   *  @param {string} userId - The id of the of observer
   * @returns {Object}  Interface
   */
  async getObserverDetails(userId: string, InstiuteDetails?: boolean) {
    const students: SFStudentsObserver[] | SFMentorStudentsInstitute[] =
      await this.sfService.models.relationships.get(
        'Name, hed__Contact__c, hed__Contact__r.Grade__c, hed__Contact__r.Name, hed__Contact__r.Primary_Educational_Institution__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Palette_Email__c, hed__Contact__r.Is_Deactive__c',
        {
          hed__RelatedContact__c: userId,
          hed__Type__c: ObserverSubRoles,
        },
      );
    if (students.length === 0) {
      throw new BadRequestException(Errors.OBSERVER_STUDENT_NOT_FOUND);
    }
    // filtering students and ids to query for mentors
    const ids = [];
    const InstituteIds = [];
    const filteredStudents: StudentDetails[] = [];

    students.map((s) => {
      if (s.hed__Contact__r.Is_Deactive__c === false) {
        const filteredStudentObj = {
          Id: s.hed__Contact__c,
          name: s.hed__Contact__r.Name,
          profilePicture: s.hed__Contact__r.Profile_Picture__c,
          grade: s.hed__Contact__r.Grade__c,
          isRegistered: s.hed__Contact__r.IsRegisteredOnPalette__c,
        };
        InstituteIds.push(s.hed__Contact__r.Primary_Educational_Institution__c);
        filteredStudents.push(filteredStudentObj);
        ids.push(s.hed__Contact__c);
      }
    });
    // getting mentors
    const mentors: SFMentorStudents[] =
      await this.sfService.models.relationships.get(
        'hed__Contact__c, hed__Contact__r.Name, hed__RelatedContact__r.Id, hed__RelatedContact__r.Name, hed__RelatedContact__r.Designation__c, hed__Type__c, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.IsRegisteredOnPalette__c, hed__RelatedContact__r.Palette_Email__c,hed__RelatedContact__r.Is_Deactive__c',
        {
          hed__Contact__c: ids,
          hed__Type__c: MentorSubRoles, // Mentor ==> Advisor}
        },
      );

    // filtering mentors
    const filteredMentors = [];
    mentors.map((m) => {
      if (m.hed__RelatedContact__r.Is_Deactive__c === false) {
        const filteredMentorObj = {
          Id: m.hed__RelatedContact__r.Id,
          name: m.hed__RelatedContact__r.Name,
          profilePicture: m.hed__RelatedContact__r.Profile_Picture__c,
          designation: m.hed__RelatedContact__r.Designation__c || null,
          isRegistered: m.hed__RelatedContact__r.IsRegisteredOnPalette__c,
        };
        filteredMentors.push(filteredMentorObj);
      }
    });

    // deleting all the duplicates
    const uniqueMentorIds = [];
    const uniqueMentors = filteredMentors.filter((value) => {
      if (uniqueMentorIds.indexOf(value.Id) == -1) {
        uniqueMentorIds.push(value.Id);
        return true;
      }
      return false;
    });

    // getting the institute name of mentors with mentors ID
    const institute = await this.sfService.models.affiliations.get(
      'hed__Contact__c, hed__Account__r.Name',
      { hed__Contact__c: uniqueMentorIds, hed__Role__c: 'Advisor' },
    );

    // filtering mentor with institute names by matching the id
    const mentorWithInstitute: MentorDetails[] = [];

    for (const mentor of uniqueMentors) {
      let found = false;
      for (const i of institute) {
        if (i.hed__Contact__c === mentor.Id) {
          const obj = {
            Id: mentor.Id,
            name: mentor.name,
            profilePicture: mentor.profilePicture,
            designation: mentor.designation,
            institute: i.hed__Account__r.Name || null,
            isRegistered: mentor.isRegistered,
          };
          mentorWithInstitute.push(obj);
          found = true;
          break;
        }
      }
      if (!found) {
        const obj = {
          Id: mentor.Id,
          name: mentor.name,
          designation: mentor.designation,
          institute: null,
          isRegistered: mentor.isRegistered,
        };
        mentorWithInstitute.push(obj);
      }
    }
    if (InstiuteDetails === true) {
      return {
        statusCode: 200,
        message: Responses.OBSERVER_DETAILS,
        data: {
          students: filteredStudents,
          mentors: mentorWithInstitute,
          institute: InstituteIds,
        },
      };
    } else {
      return {
        statusCode: 200,
        message: Responses.OBSERVER_DETAILS,
        data: {
          students: filteredStudents,
          mentors: mentorWithInstitute,
        },
      };
    }
  }
}
