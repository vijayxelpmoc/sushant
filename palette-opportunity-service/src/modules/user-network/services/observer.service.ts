import { SfService } from '@gowebknot/palette-salesforce-service';
import { Notifier } from '@gowebknot/palette-wrapper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GuardianSubRoles,
  MentorSubRoles,
  ObserverSubRoles,
} from '@src/modules/opportunity/types';
import {
  MentorDetails,
  ObserverDetails,
  ObserverDetailsInstitute,
  SFMentorStudents,
  SFMentorStudentsInstitute,
  SFStudentsObserver,
  StudentDetails,
} from '../types/observer-interface';

@Injectable()
export class ObserverService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  /** sends observer details on the basis of the id
   *  @param {string} userId - The id of the of observer
   * @returns {Object}  Interface
   */
  async getObserverDetails(
    userId: string,
    instituteId: string,
    programId: string,
    InstiuteDetails?: boolean,
  ): Promise<ObserverDetails | ObserverDetailsInstitute> {
    const students: SFStudentsObserver[] | SFMentorStudentsInstitute[] =
      await this.sfService.models.relationships.get(
        'Contact.Id, Contact.Grade, Contact.Name, Contact.Primary_Educational_Institution, Contact.Profile_Picture, Contact.IsRegisteredOnPalette, Contact.Palette_Email, Contact.Is_Deactive',
        {
          Related_Contact: userId,
          Type: ObserverSubRoles,
          // Type: 'Observer',
        },
        {},
        instituteId,
      );
    
    if (students.length === 0) {
      throw new NotFoundException('no students found');
    }

    // filtering students and ids to query for mentors
    const ids = [];
    const InstituteIds = [];
    const filteredStudents: StudentDetails[] = [];

    students.map((s) => {
      if (s.Contact.Is_Deactive === false) {
        const filteredStudentObj = {
          Id: s.Contact.Id,
          name: s.Contact.Name,
          profilePicture: s.Contact.Profile_Picture,
          grade: s.Contact.Grade,
          isRegistered: s.Contact.IsRegisteredOnPalette,
        };
        InstituteIds.push(s.Contact.Primary_Educational_Institution);
        filteredStudents.push(filteredStudentObj);
        ids.push(s.Contact.Id);
      }
    });

    // console.log('students', students,ids);

    // getting mentors
    const mentors: SFMentorStudents[] =
      await this.sfService.models.relationships.get(
        instituteId.startsWith('paws__') ?
        'Contact.Id, Contact.Name, Related_Contact.Id, Related_Contact.Name, Related_Contact.Profile_Picture, Related_Contact.IsRegisteredOnPalette, Related_Contact.Palette_Email, Related_Contact.Is_Deactive'
        : 'Contact.Id, Contact.Name, Related_Contact.Id, Related_Contact.Name, Related_Contact.Designation, Related_Contact.Profile_Picture, Related_Contact.IsRegisteredOnPalette, Related_Contact.Palette_Email, Related_Contact.Is_Deactive',
        {
          Contact: [...ids],
          Type: MentorSubRoles,
          // Contact: ids[0],
          // Type: 'Advisor',
        },
        {},
        instituteId,
      );

      console.log("mentors",mentors);
      
    // filtering mentors
    const filteredMentors = [];
    mentors.map((m) => {
      if (m.Related_Contact.Is_Deactive === false) {
        const filteredMentorObj = {
          Id: m.Related_Contact.Id,
          name: m.Related_Contact.Name,
          profilePicture: m.Related_Contact.Profile_Picture,
          designation: instituteId.startsWith('paws__') ? null : m.Related_Contact.Designation,   // add Designation in PAWS
          isRegistered: m.Related_Contact.IsRegisteredOnPalette,
        };
        filteredMentors.push(filteredMentorObj);
      }
    });

    // deleting all the duplicates
    const uniqueMentorIds = [];
    const uniqueMentors = filteredMentors.filter((value, index, self) => {
      if (uniqueMentorIds.indexOf(value.Id) == -1) {
        uniqueMentorIds.push(value.Id);
        return true;
      }
      return false;
    });

    let institute = [];
    // getting the institute name of mentors with mentors ID
    if (instituteId.startsWith('paws__')) {
      institute = await this.sfService.paws.programDetails(programId, instituteId);
    } else {
      institute = await this.sfService.models.affiliations.get(
        'Contact, Organization.Name',
        { Contact: [...uniqueMentorIds], Role: 'Advisor' },
        {},
        instituteId,
      );
    }

    // filtering mentor with institute names by matching the id
    const mentorWithInstitute: MentorDetails[] = [];

    for (const mentor of uniqueMentors) {
      let found = false;
      let obj = null;
      if (instituteId.startsWith('paws__')) {
        obj = {
          Id: mentor.Id,
          name: mentor.name,
          profilePicture: mentor.profilePicture,
          designation: mentor.designation,
          institute: institute[0].Name,
          isRegistered: mentor.isRegistered,
        };
        mentorWithInstitute.push(obj);
        found = true;
      } else {
        for (const i of institute) {
          if (i.Contact === mentor.Id) {
            obj = {
              Id: mentor.Id,
              name: mentor.name,
              profilePicture: mentor.profilePicture,
              designation: mentor.designation,
              institute: instituteId.startsWith('paws__') ? i.Name : i.Organization.Name,
              isRegistered: mentor.isRegistered,
            };
            mentorWithInstitute.push(obj);
            found = true;
            break;
          }
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
        data: {
          students: filteredStudents,
          mentors: mentorWithInstitute,
          institute: InstituteIds,
        },
      };
    } else {
      return {
        statusCode: 200,
        data: {
          students: filteredStudents,
          mentors: mentorWithInstitute,
        },
      };
    }
  }
}
