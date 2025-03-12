#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DbStack } from '../lib/db-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

// Define app configuration
const app = new cdk.App();
const appName = 'ad-cm';
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
};

// Export the app initializer as a class for cdk.test.ts
export class App {
  constructor(scope: cdk.App) {
    // Your initialization code here
    const appName = 'ad-cm';
    const env = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
    };
    // ...rest of your code
  }
}

// Configuration for different environments
const envConfig = {
  dev: {
    environment: 'dev',
    // Add environment-specific configurations here
  },
  prod: {
    environment: 'prod',
    // Add environment-specific configurations here
  },
};

// Determine which environment to deploy based on context or default to dev
const deployEnv = app.node.tryGetContext('env') || 'dev';
const deployIntegrationApi = app.node.tryGetContext('deployIntegrationApi') === 'true';
const config = envConfig[deployEnv as keyof typeof envConfig];

// Create the stacks
const networkStack = new NetworkStack(app, `${appName}-${config.environment}-network`, {
  appName,
  environment: config.environment,
  env,
  description: `Network infrastructure for ${appName} ${config.environment} environment`,
  tags: {
    Application: appName,
    Environment: config.environment,
    ManagedBy: 'CDK',
  },
});

const dbStack = new DbStack(app, `${appName}-${config.environment}-db`, {
  appName,
  environment: config.environment,
  vpc: networkStack.vpc,
  databaseSecurityGroup: networkStack.databaseSecurityGroup,
  apiSecurityGroup: networkStack.apiSecurityGroup,
  env,
  description: `Database infrastructure for ${appName} ${config.environment} environment`,
  tags: {
    Application: appName,
    Environment: config.environment,
    ManagedBy: 'CDK',
  },
});

const apiStack = new ApiStack(app, `${appName}-${config.environment}-api`, {
  appName,
  environment: config.environment,
  vpc: networkStack.vpc,
  apiSecurityGroup: networkStack.apiSecurityGroup,
  dbEndpoint: dbStack.dbEndpoint,
  dbCredentials: dbStack.dbCredentials,
  env,
  deployIntegrationApi,
  description: `API services for ${appName} ${config.environment} environment`,
  tags: {
    Application: appName,
    Environment: config.environment,
    ManagedBy: 'CDK',
  },
});

// Use the actual ALB endpoint that we know is working
// This avoids cross-stack reference issues with CloudFormation
const actualApiEndpoint = `http://ad-cm-dev-alb-1169756354.eu-central-1.elb.amazonaws.com:8080`;

const frontendStack = new FrontendStack(app, `${appName}-${config.environment}-frontend`, {
  appName,
  environment: config.environment,
  apiEndpoint: actualApiEndpoint, // Use the hardcoded endpoint
  env,
  description: `Frontend infrastructure for ${appName} ${config.environment} environment`,
  tags: {
    Application: appName,
    Environment: config.environment,
    ManagedBy: 'CDK',
  },
});

// Add explicit dependency to ensure the API stack is deployed before the frontend
frontendStack.addDependency(apiStack);