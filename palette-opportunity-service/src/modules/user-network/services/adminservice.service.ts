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
  ): Promise<InstituteDetailsResponse> {
    const studentIds = [];
    const filteredAdmins = [];

    // getting the institute of the admin
    const institute: SFInstitute[] =
      await this.sfService.models.affiliations.get(
        'Id, Name,  Organization, Organization.Name, Organization.Id',
        {
          Contact: userId,
          Role: 'Admin',
        },
        {},
        instituteId,
      );

    // console.log('third', institute[0].Organization);

    if (institute.length === 0) {
      throw new BadRequestException('Admin has no institute assigned');
    }

    // getting all the admin inside the institute
    const Admins: SFAdmins[] = await this.sfService.models.affiliations.get(
      'Contact, Role, Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.IsRegisteredOnPalette, Contact.Is_Deactive',
      {
        Organization: institute[0].Organization.Id,
        Role: 'Admin',
      },
      {},
      instituteId,
    );

    // console.log('fourth', Admins);

    if (Admins.length > 0) {
      Admins.map((admin) => {
        // checking this to exclude the user that are deactivated
        // and also excluding the user requesting
        if (
          admin.Contact.Id !== userId &&
          admin.Contact
          // &&
          // admin.Contact.Is_Deactive === false
        ) {
          try {
            const adminObj = {
              Id: admin.Contact.Id,
              name: admin.Contact.Name,
              profilePicture: admin.Contact.Profile_Picture || null,
              isRegistered: admin.Contact.IsRegisteredOnPalette,
            };
            filteredAdmins.push(adminObj);
          } catch (error) {
            // console.log(admin);
          }
        }
      });
    }

    // getting all the students inside the institute
    const students: SFStudents[] = await this.sfService.generics.contacts.get(
      'Id, Name, Grade, Primary_Educational_Institution, Profile_Picture, Is_Deactive, IsRegisteredOnPalette',
      {
        Primary_Educational_Institution: institute[0].Organization.Id,
        Record_Type_Name: 'Student',
      },
      {},
      instituteId,
    );

    // console.log('fifth', students);

    // getting all the mentors inside the institute
    const mentors: SFMentors[] = await this.sfService.models.affiliations.get(
      'Id, Name, Organization, Affiliation_Type, Contact, Description, Role, Contact.Id, Contact.Name, Contact.Designation, Contact.Profile_Picture, Contact.IsRegisteredOnPalette, Contact.Palette_Email, Contact.Is_Deactive',
      {
        Organization: institute[0].Organization.Id,
        // Role: ['Advisor', 'Observer'],
      },
      {},
      instituteId,
    );
    // console.log('sixth', mentors);

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
              ? student.Primary_Educational_Institution.Id
              : null,
            grade: student.Grade,
            isRegistered: student.IsRegisteredOnPalette,
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
            Id: mentor.Contact.Id,
            name: mentor.Contact.Name,
            profilePicture: mentor.Contact.Profile_Picture,
            instituteName: institute[0].Organization.Account_Name,
            designation: mentor.Contact.Designation,
            role: mentor.Role,
            isRegistered: mentor.Contact.IsRegisteredOnPalette,
          };
          filteredMentor.push(filteredObj);
        }
      });
    }

    // getting all the guardians of the students
    const studentConnection: StudentConnectionResponseSF[] =
      await this.sfService.models.relationships.get(
        'Contact.Primary_Educational_Institution, Contact.Designation, Related_Contact,Related_Contact.Id,Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.Palette_Email, Type, Related_Contact.Is_Deactive,Related_Contact.IsRegisteredOnPalette',
        {
          Contact: studentIds,
          Type: GuardianSubRoles,
        },
        {},
        instituteId,
      );
    // console.log('seventh', studentConnection);

    const filteredParent: MentorParentResponse[] = [];
    const filteredObserver: ObserverParentResponse[] = [];

    if (studentConnection.length > 0) {
      studentConnection.map((user) => {
        // checking this to exclude the user that are deactivated
        if (user.Related_Contact.Is_Deactive === false) {
          const filteredObj = {
            Id: user.Related_Contact.Id,
            name: user.Related_Contact.Name,
            profilePicture: user.Related_Contact.Profile_Picture,
            instituteName: institute[0].Organization.Account_Name,
            designation: user.Contact.Designation,
            role: user.Contact.Designation,
          };
          if (user.Type === 'Observer') {
            filteredObserver.push(filteredObj);
          } else {
            filteredParent.push(filteredObj);
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
