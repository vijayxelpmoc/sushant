export const getMappedActivityObject = (
    sfActivityDetail: any,
): any => ({
activity_id: sfActivityDetail.Id,
name: sfActivityDetail.Account_Name,
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
OpportunityScope: sfActivityDetail.opportunityScope,
});