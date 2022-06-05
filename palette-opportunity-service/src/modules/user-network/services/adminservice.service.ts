import { SfService } from '@gowebknot/palette-salesforce-service';
import { Notifier } from '@gowebknot/palette-wrapper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { GuardianSubRoles } from '@src/modules/opportunity/types';
import {
  InstituteDetailsResponse,
  MentorParentResponse,
  ObserverParentResponse,
  SFAdmins,
  SFInstitute,
  SFMentors,
  SFStudents,
  StudentConnectionResponseSF,
} from '../types/admin-interface';
import { StudentResponse } from '../types/advisor-interface';

@Injectable()
export class AdminService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  /** Gets admin details (all the user that are inside the institute - students, mentors)
   *  @param {userId} string - admin id
   * @returns {Object} students and mentors that are inside the same institute as admin
   */
  async getAdminInstituteDetails(
    userId: string,
    instituteId: string,
    programId: string,
  ): Promise<InstituteDetailsResponse> {
    const studentIds = [];
    const filteredAdmins = [];

    // getting the institute of the admin
    const responseData =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, Mailing_Address, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Designation, Account_Name, Profile_Picture',
        {
          Id: userId,
          Primary_Educational_Institution: programId,
        },
        {},
        instituteId,
      );
    console.log({responseData});

    const instituteDetails = await this.sfService.models.accounts.get(
      'Id, Name',
      {
        Id: responseData[0].Account_Name
      },
      {},
      instituteId,
    );

    console.log({instituteDetails});

    // getting all the admin inside the institute
    const Admins: SFAdmins[] = await this.sfService.models.affiliations.get(
      'Contact, Role',
      {
        Organization: responseData[0].Account_Name,
        Role: 'Administrator'
      },
      {},
      instituteId,
    );

    const otherAdminIds = Admins.map((admin) => admin.Contact);

    const otherAdminDetails = await this.sfService.generics.contacts.get(
      'Id, Name, Profile_Picture, IsRegisteredOnPalette',
      {
        Id: otherAdminIds,
      },
      {},
      instituteId
    );

    console.log('fourth', otherAdminDetails);

    if (otherAdminDetails.length > 0) {
      otherAdminDetails.map((admin) => {
        // checking this to exclude the user that are deactivated
        // and also excluding the user requesting
        if (
          admin.Id !== userId
          // admin.Is_Deactive === false
        ) {
          try {
            const adminObj = {
              Id: admin.Id,
              name: admin.Name,
              profilePicture: admin.Profile_Picture || null,
              isRegistered: admin.IsRegisteredOnPalette,
            };
            filteredAdmins.push(adminObj);
          } catch (error) {
            console.error(error);
          }
        }
      });
    }

    // getting all the students inside the institute
    const students: SFStudents[] = await this.sfService.generics.contacts.get(
      'Id, Name, Grade, Primary_Educational_Institution, Profile_Picture, Is_Deactive, IsRegisteredOnPalette',
      {
        Primary_Educational_Institution: responseData[0].Account_Name,
        Record_Type_Name: 'Student',
      },
      {},
      instituteId,
    );

    console.log('fifth', students);

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
            institute: student.Primary_Educational_Institution || null,
            grade: student.Grade,
            isRegistered: student.IsRegisteredOnPalette,
          };
          filteredStudents.push(filteredObj);
          studentIds.push(student.Id);
        }
      });
    }

    // getting all the mentors inside the institute
    const mentors: SFMentors[] = await this.sfService.models.affiliations.get(
      'Id, Name, Organization, Affiliation_Type, Contact, Description, Role',
      {
        Organization: responseData[0].Account_Name,
        Role: ['Advisor', 'Observer'],
      },
      {},
      instituteId,
    );

    const otherMentorIds = mentors.map((mentor) => mentor.Contact);

    const otherMentorDetails = await this.sfService.generics.contacts.get(
      'Id, Name, Profile_Picture, Designation, Is_Deactive, IsRegisteredOnPalette',
      {
        Id: otherMentorIds,
      },
      {},
      instituteId
    );

    console.log('sixth', mentors);


    const filteredMentor: MentorParentResponse[] = [];
    if (otherMentorDetails.length > 0) {
      otherMentorDetails.map((mentor) => {
        // checking this to exclude the user that are deactivated
        if (mentor && mentor.Is_Deactive === false) {
          const filteredObj = {
            Id: mentor.Id,
            name: mentor.Name,
            profilePicture: mentor.Profile_Picture,
            instituteName: instituteDetails[0].Account_Name,
            designation: mentor.Designation,
            role: mentor.Role,
            isRegistered: mentor.IsRegisteredOnPalette,
          };
          filteredMentor.push(filteredObj);
        }
      });
    }

    // getting all the guardians of the students
    const studentConnection: StudentConnectionResponseSF[] =
      await this.sfService.models.relationships.get(
        'Relationship_Number, Contact, Related_Contact, Type',
        {
          Contact: studentIds,
          Type: GuardianSubRoles,
        },
        {},
        instituteId,
      );

      const relatedContactIds = studentConnection.map((contact) => contact.Related_Contact);
      const contactIds = studentConnection.map(contact => contact.Contact)

      const relatedContactDetails = await this.sfService.generics.contacts.get(
        'Id, Name, Profile_Picture, Account_Name, Designation, Is_Deactive, IsRegisteredOnPalette',
        {
          Id: relatedContactIds,
        },
        {},
        instituteId
      );

      const contactDetails = await this.sfService.generics.contacts.get(
        'Id, Name, Profile_Picture, Account_Name, Designation, Is_Deactive, IsRegisteredOnPalette',
        {
          Id: contactIds,
        },
        {},
        instituteId
      );

      for(const i in studentConnection){
        studentConnection[i].Related_Contact = relatedContactDetails[i];
        studentConnection[i].Contact = contactDetails[i];
      }


      
    console.log('seventh', studentConnection);

    const filteredParent: MentorParentResponse[] = [];
    const filteredObserver: ObserverParentResponse[] = [];

    if (studentConnection.length > 0) {
      studentConnection.map((user) => {
        // checking this to exclude the user that are deactivated
        if (user.Related_Contact) {
          if (user.Related_Contact.Is_Deactive === false) {
            const filteredObj = {
              Id: user.Related_Contact.Id,
              name: user.Related_Contact.Name,
              profilePicture: user.Related_Contact.Profile_Picture,
              instituteName: instituteDetails[0].Account_Name,
              designation: user.Contact.Designation,
              role: user.Contact.Designation,
            };
            if (user.Type === 'Observer') {
              filteredObserver.push(filteredObj);
            } else {
              filteredParent.push(filteredObj);
            }
          }
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

    const response: InstituteDetailsResponse = {
      statusCode: 200,
      data: {
        students: filteredStudents,
        mentors: filteredMentor,
        parents: uniqueParents,
        observers: uniqueObserver,
        admins: filteredAdmins,
      },
    };
    return response;
  }
}
