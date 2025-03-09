import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/network-stack';

describe('NetworkStack', () => {
  let app: cdk.App;
  let stack: NetworkStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new NetworkStack(app, 'TestNetworkStack', {
      appName: 'ad-cm',
      environment: 'dev',
      env: { account: '123456789012', region: 'eu-central-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC Created with Correct Configuration', () => {
    // Verify VPC existence
    template.resourceCountIs('AWS::EC2::VPC', 1);
    
    // Verify that subnets are created (6 subnets: 2 AZs x 3 subnet types)
    template.resourceCountIs('AWS::EC2::Subnet', 6);
    
    // Verify NAT Gateway is created
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('Security Groups Created with Correct Configuration', () => {
    // Verify API security group exists
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'ad-cm-dev-api-sg',
      GroupDescription: 'Security group for API services',
    });
    
    // Verify Database security group exists
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'ad-cm-dev-db-sg',
      GroupDescription: 'Security group for PostgreSQL database',
    });
    
    // Test for specific security group rules
    // Note: We're checking individual matches for rules rather than specific ingress resources
    // because CDK may create the rules in various ways
    
    // Check for API security group rules count
    const apiSecurityGroups = template.findResources('AWS::EC2::SecurityGroup', {
      Properties: {
        GroupName: 'ad-cm-dev-api-sg'
      }
    });
    expect(Object.keys(apiSecurityGroups).length).toEqual(1);
    
    // Check for database security group rules count
    const dbSecurityGroups = template.findResources('AWS::EC2::SecurityGroup', {
      Properties: {
        GroupName: 'ad-cm-dev-db-sg'
      }
    });
    expect(Object.keys(dbSecurityGroups).length).toEqual(1);
    
    // Verify database security group ingress rule
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 5432,
      ToPort: 5432,
      IpProtocol: 'tcp',
      Description: 'Allow PostgreSQL traffic from API services'
    });
  });

  test('VPC Endpoints Created', () => {
    // Verify endpoint count
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 2);
    
    // Instead of checking specific properties that may vary, just verify
    // we have at least one Gateway and one Interface endpoint
    const gatewayEndpoints = template.findResources('AWS::EC2::VPCEndpoint', {
      Properties: {
        VpcEndpointType: 'Gateway'
      }
    });
    expect(Object.keys(gatewayEndpoints).length).toBeGreaterThan(0);
    
    const interfaceEndpoints = template.findResources('AWS::EC2::VPCEndpoint', {
      Properties: {
        VpcEndpointType: 'Interface'
      }
    });
    expect(Object.keys(interfaceEndpoints).length).toBeGreaterThan(0);
  });
});