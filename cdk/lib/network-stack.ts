import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly apiSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create a VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${props.appName}-${props.environment}-vpc`,
      maxAzs: 2,
      natGateways: 1, // Cost optimization, but reduces AZ redundancy
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-with-nat',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create security group for API services (core-api and integration-api)
    this.apiSecurityGroup = new ec2.SecurityGroup(this, 'ApiSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for API services',
      securityGroupName: `${props.appName}-${props.environment}-api-sg`,
      allowAllOutbound: true,
    });

    // Allow inbound HTTP traffic
    this.apiSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.apiSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Create security group for the database
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for PostgreSQL database',
      securityGroupName: `${props.appName}-${props.environment}-db-sg`,
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from API security group only
    this.databaseSecurityGroup.addIngressRule(
      this.apiSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from API services'
    );

    // VPC endpoints for AWS services (optional, for enhanced security and lower costs)
    new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    new ec2.InterfaceVpcEndpoint(this, 'EcrDockerEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Output the VPC ID for reference in other stacks
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'The ID of the VPC',
      exportName: `${props.appName}-${props.environment}-vpc-id`,
    });

    // Output the security group IDs
    new cdk.CfnOutput(this, 'ApiSecurityGroupId', {
      value: this.apiSecurityGroup.securityGroupId,
      description: 'The ID of the API security group',
      exportName: `${props.appName}-${props.environment}-api-sg-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroup.securityGroupId,
      description: 'The ID of the database security group',
      exportName: `${props.appName}-${props.environment}-db-sg-id`,
    });
  }
}