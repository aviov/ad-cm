# Campaign Management Web Application

A modern web application for advertisers to create, manage and monitor their marketing campaigns across different ad networks.

## Overview

This application allows advertisers to:
- Create and manage ad campaigns
- Configure country-specific payouts
- Toggle campaign status (run/stop)
- Search and filter campaigns

## Business Case
Advertisers need to create, run, and manage ad campaigns, including setting up payouts according to countries.
Advertisers need to plan by time period, locate in countries, execute and monitor performance of their marketing campaigns, track budget being spent on campaigns and mitigate risks to increase budget.
The most valuable features and data structure is described by entities Campaign, Payout (with budget), Countries. This will cover the main features of the application and some added value features, like budget alerts and dashboard.

### Main Features

1. **Create New Campaign**:
   - Title and Landing Page URL are mandatory.
   - At least one payout should be added.
   - Advertisers can select multiple countries and track payouts.

2. **Run and Stop a Campaign**:
   - Toggle the "Is Running" flag to start or stop a campaign.

3. **List Created Campaigns**:
   - Show Title, Landing Page URL, and Payouts.

4. **Search for Campaigns**:
   - Search by Title, Landing Page URL, and "Is Running" status.
   - Filtering functionality is implemented on the backend.

5. **Budget Management**:
   - Each campaign has a budget to predict spending.
   - Budget can be set as an attribute in the Payout entity.

6. **Integration with Ad Networks**:
   - The application can integrate with ad networks like Taboola and Adcash.
   - Integration requirements are assumed for Adcash.

### Campaign Attributes

1. **Title**: The name of the campaign.
2. **Landing Page URL**: The destination URL where ad visitors are directed.
3. **Is Running**: A flag specifying if the campaign is active on the ad network.
4. **Payouts**: A set of payout amounts specifying how much money will be offered per specific country.
5. **Budget**: The budget for the campaign.

### Added Value Features

- **Dashboard**: Visualize the budget over time with a diagram showing the budget (y-axis) over a timeline (x-axis). Include current date and budget as a point (x, y).
- **Consolidated Budget Limits**: Display consolidated budget limits by filtered campaigns on the diagram.
- **Vertical Bar Chart**: Show payouts vs. budgets by each country.
- **Budget Alert**: Notify advertisers by email when the budget limit is reached.

### Integration Layer

- integration-api is a separate service that syncs the app’s campaigns with external ad networks (Taboola, Adcash).
- core-api notifies the integration service when campaigns need syncing.

## Project Structure

- **client**: React frontend with React and Chakra UI
- **core-api**: Backend API for campaign management
- **integration-api**: Service for ad network integrations
- **cdk**: AWS infrastructure code

## Development

### Prerequisites
- Node.js 22+
- Docker and Docker Compose
- AWS CLI (for deployment)

### Local Setup
1. Clone the repository
2. Run `docker-compose up` to start the development environment
3. Navigate to client directory and run `npm install` and `npm run dev`

### Deployment
1. Use the client.yml workflow to deploy the frontend
2. Use the core-api.yml workflow to deploy the backend
3. Use the integration-api.yml workflow to deploy the integrations service

## Team

Marketing Technology Team @ Advertising

## License

Proprietary - All rights reserved