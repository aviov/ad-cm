# Ad Campaign Management - CDK Deployment Guide

This project contains AWS CDK infrastructure code for deploying the Ad Campaign Management platform.

## Architecture Overview

The infrastructure consists of the following stacks:
- Network stack: VPC, subnets, security groups
- Database stack: RDS PostgreSQL instance, Secrets Manager credentials
- API stack: ECS Fargate services for core-api and optional integration-api
- Frontend stack: CloudFront distribution and S3 bucket for static content

## Deployment Instructions

### Prerequisites

- AWS CLI installed and configured
- Node.js and npm installed
- AWS CDK installed
- Docker installed

### 1. Setup AWS profile and environment:
```bash
export AWS_PROFILE=<your-profile>
export AWS_REGION=<your-region>
```

### 2. Bootstrap AWS environment for CDK (first time only):
```bash
cdk bootstrap aws://<account-id>/<region>
```

### 3. Deploy CDK stacks in sequence:
```bash
# Deploy network stack
cdk deploy ad-cm-dev-network --context env=dev

# Deploy database stack
cdk deploy ad-cm-dev-database --context env=dev

# Deploy API stack (without integration API)
cdk deploy ad-cm-dev-api --context env=dev --context deployIntegrationApi=false

# Deploy frontend stack
cdk deploy ad-cm-dev-frontend --context env=dev
```

### 4. Building and pushing Docker images to ECR:
- Initial deployment might require to build and push Docker images during the API stack deployment at process of building clusters / services.
- If you need to build and push Docker images manually at any time, follow the steps below:

#### a. Retrieve ECR repository URI:
```bash
export ECR_REPO=$(aws ecr describe-repositories --repository-names ad-cm-dev-core-api --query 'repositories[0].repositoryUri' --output text)
```

#### b. Login to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REPO
```

#### c. Build images for AWS (linux/amd64 platform):
```bash
# Navigate to core-api directory
cd ../core-api

# Build with correct platform for AWS
docker buildx build --platform linux/amd64 -t $ECR_REPO:latest .
```

#### d. Tag and push images:
```bash
docker push $ECR_REPO:latest
```

#### e. For integration API (if needed):
```bash
cd ../integration-api
export INTEG_REPO=$(aws ecr describe-repositories --repository-names ad-cm-dev-integration-api --query 'repositories[0].repositoryUri' --output text)
docker buildx build --platform linux/amd64 -t $INTEG_REPO:latest .
docker push $INTEG_REPO:latest
```

### 5. Building and deploying the frontend:

#### a. Build the client application:
```bash
# Navigate to the client directory
cd ../client

# Install dependencies if needed
npm install

# Build the production assets
npm run build
```

#### b. Deploy the frontend stack:
```bash
# Navigate back to the CDK directory
cd ../cdk

# Deploy the frontend stack
cdk deploy ad-cm-dev-frontend --context env=dev
```

#### c. Find the CloudFront distribution URL:
```bash
# The CloudFront URL will be shown in the outputs after deployment
aws cloudformation describe-stacks --stack-name ad-cm-dev-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
  --output text
```

#### d. Updating frontend and invalidating CloudFront cache:
```bash
# After making changes to the frontend code, rebuild:
cd ../client
npm run build

# Get the S3 bucket name from CloudFormation outputs
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

# Sync the new build to S3
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

# Get the CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text)

# Create an invalidation to clear the CloudFront cache
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### 6. Updating existing deployments:
```bash
# After code changes, rebuild and push Docker images
# Then redeploy only the needed stack(s)
cdk deploy ad-cm-dev-api --context env=dev --context deployIntegrationApi=false
```

## Troubleshooting

### Common deployment issues and solutions:

1. **ECS task failures**:
   - Check ECS task logs in CloudWatch
   - Verify Secret Manager keys match what's expected in the CDK stack (e.g., using 'username' not 'postgres_admin')
   - Ensure IAM roles have correct permissions

2. **Database connection issues**:
   - Confirm security group rules allow traffic from API to database
   - Verify database credentials in Secrets Manager

3. **Image compatibility**:
   - Always use `--platform linux/amd64` when building on Apple Silicon Macs
   - Ensure correct platform compatibility for AWS ECS

### Database Connectivity Debugging

If you need to verify database connectivity between the API and RDS instance, follow these steps:

#### 1. Create a test task to validate database connectivity

```bash
# Get VPC ID
VPC_ID=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-network \
  --query "Stacks[0].Outputs[?OutputKey=='VpcId'].OutputValue" --output text)

# Get private subnet IDs
PRIVATE_SUBNET=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  "Name=tag:Name,Values=*Private*" --query "Subnets[0].SubnetId" --output text)

# Get security group ID
SG_ID=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-network \
  --query "Stacks[0].Outputs[?OutputKey=='ApiSecurityGroupId'].OutputValue" --output text)

# Get RDS endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-database \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)

# Get Secrets Manager ARN
SECRET_ARN=$(aws cloudformation describe-stacks --stack-name ad-cm-dev-database \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseSecretArn'].OutputValue" --output text)

# Create a test task definition that uses the postgres image to test connectivity
aws ecs register-task-definition --cli-input-json '{
  "family": "db-connectivity-test",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "db-test",
      "image": "postgres:latest",
      "essential": true,
      "command": ["psql", "-h", "DB_ENDPOINT", "-U", "postgres_admin", "-c", "SELECT 1"],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/db-connectivity-test",
          "awslogs-region": "REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "secrets": [
        {
          "name": "PGPASSWORD",
          "valueFrom": "SECRET_ARN:password::"
        }
      ]
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}'
```

Replace these values in the command:
- `ACCOUNT_ID` with your AWS account ID
- `REGION` with your AWS region
- `DB_ENDPOINT` with your actual RDS endpoint
- `SECRET_ARN` with your actual Secret ARN

#### 2. Run the test task and check the logs

```bash
# Run the task
aws ecs run-task --cluster ad-cm-dev-cluster \
  --task-definition db-connectivity-test \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET],securityGroups=[$SG_ID],assignPublicIp=DISABLED}" \
  --launch-type FARGATE

# Check CloudWatch logs for the task results
```

#### 3. Verify Secrets Manager contents

```bash
# View the structure of your secrets (don't expose actual values in logs)
aws secretsmanager describe-secret --secret-id $SECRET_ARN

# Get the secret value and check key names (be careful with this command)
aws secretsmanager get-secret-value --secret-id $SECRET_ARN \
  --query "SecretString" --output text | jq 'keys'
```

These commands help verify:
1. Network connectivity from ECS to RDS
2. Credentials work properly
3. Secret structure matches what your application expects

## Additional CDK Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## GitHub CI/CD Setup with OIDC

This project can be set up to use GitHub Actions with OIDC (OpenID Connect) for secure authentication to AWS without storing long-lived credentials.

### 1. Create an OIDC Provider in AWS

```bash
# Create OIDC provider for GitHub in AWS IAM
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list <thumbprint>
```
- Obtain the current thumbprint with a command like
```bash
openssl s_client -servername token.actions.githubusercontent.com -showcerts -connect token.actions.githubusercontent.com:443 < /dev/null 2>/dev/null | openssl x509 -fingerprint -sha1 -noout | cut -d= -f2 | tr -d ':'
```

### 2. Create an IAM Role for GitHub Actions

```bash
# Create policy document for trust relationship
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:organization/ad-cm:*"
        }
      }
    }
  ]
}
EOF

# Replace ACCOUNT_ID with your actual AWS account ID
sed -i '' "s/ACCOUNT_ID/$(aws sts get-caller-identity --query Account --output text)/g" trust-policy.json

# Create IAM role
aws iam create-role --role-name GitHubActionsRole \
  --assume-role-policy-document file://trust-policy.json

# Attach necessary policies 
aws iam attach-role-policy --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECR-FullAccess

aws iam attach-role-policy --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess

aws iam attach-role-policy --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# For CDK deployments, create and attach custom policy
cat > cdk-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ecs:*",
        "ec2:*",
        "iam:*",
        "secretsmanager:*",
        "rds:*",
        "lambda:*",
        "elasticloadbalancing:*",
        "route53:*",
        "ssm:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy --policy-name CDKDeploymentPolicy \
  --policy-document file://cdk-policy.json

aws iam attach-role-policy --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/CDKDeploymentPolicy
```

### 3. Configure GitHub Actions Workflow

Add this to your GitHub workflow files:

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ vars.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ vars.AWS_REGION }}

      - name: Deploy with CDK
        run: |
          cd cdk
          npm ci
          npm run build
          npx cdk deploy --context env=dev --all --require-approval never
```

### 4. Add GitHub Repository Variables

In your GitHub repository settings, add these variables:
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_REGION`: The AWS region to deploy to (e.g., us-east-1)

### Benefits of OIDC Authentication

- **Security**: No long-lived AWS credentials stored in GitHub secrets
- **Auditability**: AWS CloudTrail logs show the GitHub workflow identity that performed actions
- **Fine-grained control**: Can restrict permissions based on repository, branch, tag, or environment
