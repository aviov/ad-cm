import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DbStack } from '../lib/db-stack';
import { NetworkStack } from '../lib/network-stack';

describe('DbStack', () => {
  let app: cdk.App;
  let networkStack: NetworkStack;
  let dbStack: DbStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    
    // Create dependent network stack first
    networkStack = new NetworkStack(app, 'TestNetworkStack', {
      appName: 'ad-cm',
      environment: 'dev',
      env: { account: '123456789012', region: 'eu-central-1' },
    });
    
    // Create DB stack with dependencies from network stack
    dbStack = new DbStack(app, 'TestDbStack', {
      appName: 'ad-cm',
      environment: 'dev',
      vpc: networkStack.vpc,
      databaseSecurityGroup: networkStack.databaseSecurityGroup,
      env: { account: '123456789012', region: 'eu-central-1' },
    });
    
    template = Template.fromStack(dbStack);
  });

  test('Database Instance Created Correctly', () => {
    // Verify RDS instance is created
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    
    // Check RDS instance properties - only check properties we're sure about
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      PubliclyAccessible: false,
      StorageEncrypted: true,
    });
  });

  test('Database Credentials Secret Created', () => {
    // Verify Secrets Manager secret is created
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    
    // Check secret properties - using a simpler check
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Description: 'PostgreSQL credentials for ad-cm dev'
    });
  });
});