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
2. Run `docker-compose up core-api` to start the development environment
3. Navigate to client directory and run `npm install` and `npm run dev`

### Seeding Initial Data

The application requires country data to be available for campaign creation. To seed the local database with countries:

#### Local Development
```bash
# Navigate to core-api directory
cd core-api

# Run the seed script
npm run seed
```
This script will populate the database with a comprehensive list of countries including their names, ISO codes, and continent information. The seed data is essential for:

- Country selection in campaign creation forms
- Geographic targeting of campaigns
- Regional analytics and reporting

### Deployment

For comprehensive deployment instructions including build, push, and deployment steps, refer to:
- [CDK Deployment Guide](./cdk/README.md)

This project uses AWS CDK for infrastructure as code and deployment. The infrastructure is defined as separate stacks:

- **Network Stack**: VPC, subnets, security groups, and other networking resources
- **Database Stack**: RDS PostgreSQL instance and Secrets Manager for credentials
- **API Stack**: ECS Fargate services for core-api with health checks and IAM roles
- **Frontend Stack**: CloudFront distribution and S3 bucket for static web content

#### Seed Data to deployed RDS Database (after aws bootstrap and network deployment)
If you're running in a production or deployed dev environment, you can execute the seed command using ECS:

```bash
# Get the task definition ARN
TASK_DEF=$(aws ecs describe-task-definition --task-definition ad-cm-dev-core-api \
  --query "taskDefinition.taskDefinitionArn" --output text)

# Get VPC ID
VPC_ID=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-network \
  --query "Stacks[0].Outputs[?OutputKey=='VpcId'].OutputValue" --output text)

# Get private subnet IDs - using the exact output key instead of filtering by tag
PRIVATE_SUBNET=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-network \
  --query "Stacks[0].Outputs[?OutputKey=='ExportsOutputRefVPCprivatewithnatSubnet1SubnetD2141BCFEE648F36'].OutputValue" --output text)

# Alternative method if you need to find it by description
# PRIVATE_SUBNET=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
#   "Name=tag:Name,Values=*privatewithnat*" --query "Subnets[0].SubnetId" --output text)

# Get security group ID
SG_ID=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-network \
  --query "Stacks[0].Outputs[?OutputKey=='ApiSecurityGroupId'].OutputValue" --output text)

# Run the task with the seed command
aws ecs run-task --cluster ad-cm-dev-cluster \
  --task-definition $TASK_DEF \
  --overrides '{"containerOverrides": [{"name":"CoreApiContainer","command":["npm","run","seed"]}]}' \
  --network-configuration "awsvpcConfiguration={subnets=[\"$PRIVATE_SUBNET\"],securityGroups=[\"$SG_ID\"],assignPublicIp=DISABLED}" \
  --launch-type FARGATE
```
To monitor the task progress, you can check the logs in CloudWatch:

```bash
# Get the task ID from the output of the run-task command
TASK_ID="task-id-from-previous-command"

# Check logs in CloudWatch
aws logs get-log-events \
  --log-group-name "/ecs/ad-cm-dev" \
  --log-stream-name "core-api/CoreApiContainer/$TASK_ID" \
  --limit 100
```

## License

Proprietary - All rights reserved