export interface shipping_address{
    city: string;
    country: string;
    postal_code: string;
    state: string,
    street: string,
}

export interface institute{
    Id: string;
    name: string;
}

export interface activity {
    activity_id: string,
    name: string,
    category: string,
    start_date: string,
    end_date: string,
    description: string,
    venue: string,
    phone: string,
    shipping_address: shipping_address,
    website: string,
    ListedBy: string,
    OpportunityScope: string,
    institute: institute,
    interestedUsers: string[],
    enrolledUsers: string[],
}

export interface OpportunityPayloadResponse {
    activity: activity;
    wishListedEvent: boolean;
    recomendedEvent: boolean;
    enrolledEvent: boolean;
    resources: string[];
}



