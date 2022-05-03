import { Activity, SFActivityAccountDetail } from '../types/activity-interface';

export const getMappedActivityObject = (
  sfActivityDetail: SFActivityAccountDetail,
): Activity => ({
  activity_id: sfActivityDetail.Id,
  name: sfActivityDetail.Name,
  category:
    sfActivityDetail.Category === 'Event - Social'
      ? 'Event - Social'
      : sfActivityDetail.Category === null
      ? 'Other'
      : sfActivityDetail.Category,
  start_date: sfActivityDetail.Start_Date,
  end_date: sfActivityDetail.End_Date,
  description: sfActivityDetail.Description,
  venue: sfActivityDetail.Venue,
  phone: sfActivityDetail.Phone,
  shipping_address: sfActivityDetail.ShippingAddress
    ? {
        city: sfActivityDetail.ShippingAddress.city,
        country: sfActivityDetail.ShippingAddress.country,
        postal_code: sfActivityDetail.ShippingAddress.postalCode,
        state: sfActivityDetail.ShippingAddress.state,
        street: sfActivityDetail.ShippingAddress.street,
      }
    : {
        city: null,
        country: null,
        postal_code: null,
        state: null,
        street: null,
      },
  website: sfActivityDetail.Website,
  ListedBy: sfActivityDetail.Listed_by,
});

export const getActivityFilteredObject = (activities: Activity[]) => ({
  volunteeringActivities: activities.filter(
    (value) => value.category === 'Event - Volunteer',
  ),
  artsActivities: activities.filter(
    (value) => value.category === 'Event - Arts',
  ),
  sportsActivities: activities.filter(
    (value) => value.category === 'Event - Sports',
  ),
  socialEventsActivities: activities.filter(
    (value) => value.category === 'Event - Social',
  ),
});
