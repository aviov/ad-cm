import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DbStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
}

export class DbStack extends cdk.Stack {
  public readonly dbEndpoint: string;
  public readonly dbCredentials: secretsmanager.Secret;
  public readonly dbName: string;

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props);

    // Database configuration
    this.dbName = `${props.appName.replace(/[^a-zA-Z0-9]/g, '_')}_${props.environment}`;
    const port = 5432;
    const username = 'postgres_admin';

    // Create credentials secret
    this.dbCredentials = new secretsmanager.Secret(this, 'DBCredentialsSecret', {
      secretName: `${props.appName}/${props.environment}/db-credentials`,
      description: `PostgreSQL credentials for ${props.appName} ${props.environment}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        excludeCharacters: '"@/\\\'',
      },
    });

    // Create a subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      description: `Subnet group for ${props.appName} ${props.environment} database`,
      vpc: props.vpc,
      subnetGroupName: `${props.appName}-${props.environment}-subnet-group`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Use isolated subnets for more security
      },
    });

    // Parameter group for customizing PostgreSQL settings
    const parameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      description: `Parameter group for ${props.appName} ${props.environment} database`,
      parameters: {
        // Add any custom parameters here
        'max_connections': '100',
        'shared_buffers': '32MB', // Increase for production
        'log_statement': props.environment === 'dev' ? 'all' : 'none',
      },
    });

    // Create the database instance
    const dbInstance = new rds.DatabaseInstance(this, 'DBInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        props.environment === 'prod' 
          ? ec2.InstanceSize.MEDIUM 
          : ec2.InstanceSize.SMALL
      ),
      credentials: rds.Credentials.fromSecret(this.dbCredentials),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      subnetGroup,
      parameterGroup,
      databaseName: this.dbName,
      port,
      allocatedStorage: props.environment === 'prod' ? 20 : 10, // GB
      storageType: rds.StorageType.GP2,
      backupRetention: props.environment === 'prod' ? cdk.Duration.days(7) : cdk.Duration.days(1),
      deletionProtection: props.environment === 'prod',
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      copyTagsToSnapshot: true,
      monitoringInterval: cdk.Duration.minutes(1),
      autoMinorVersionUpgrade: true,
      instanceIdentifier: `${props.appName}-${props.environment}-postgres`,
      publiclyAccessible: false,
      storageEncrypted: true,
    });

    // Save database endpoint for reference
    this.dbEndpoint = dbInstance.instanceEndpoint.hostname;

    // Create CloudFormation outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.dbEndpoint,
      description: 'The endpoint of the database',
      exportName: `${props.appName}-${props.environment}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: this.dbName,
      description: 'The name of the database',
      exportName: `${props.appName}-${props.environment}-db-name`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.dbCredentials.secretArn,
      description: 'The ARN of the database credentials secret',
      exportName: `${props.appName}-${props.environment}-db-secret-arn`,
    });
  }
}