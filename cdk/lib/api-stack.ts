import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { ContainerInsights } from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  vpc: ec2.Vpc;
  apiSecurityGroup: ec2.SecurityGroup;
  dbEndpoint: string;
  dbCredentials: secretsmanager.Secret;
  deployIntegrationApi?: boolean;
}

export class ApiStack extends cdk.Stack {
  public readonly apiEndpoint: string;
  public readonly coreApiRepository: ecr.Repository;
  public readonly integrationApiRepository?: ecr.Repository;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create ECR repository for core API
    this.coreApiRepository = new ecr.Repository(this, 'CoreApiRepository', {
      repositoryName: `${props.appName}-${props.environment}-core-api`,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
    });

    // Conditionally create integration API repository
    if (props.deployIntegrationApi) {
      this.integrationApiRepository = new ecr.Repository(this, 'IntegrationApiRepository', {
        repositoryName: `${props.appName}-${props.environment}-integration-api`,
        removalPolicy: props.environment === 'prod' 
          ? cdk.RemovalPolicy.RETAIN 
          : cdk.RemovalPolicy.DESTROY,
        imageTagMutability: ecr.TagMutability.MUTABLE,
        imageScanOnPush: true,
      });
    }

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'ApiCluster', {
      clusterName: `${props.appName}-${props.environment}-cluster`,
      vpc: props.vpc,
      containerInsightsV2: ContainerInsights.ENABLED,
    });

    // Create Cloud Map namespace for service discovery
    const namespace = cluster.addDefaultCloudMapNamespace({
      name: `${props.appName}-${props.environment}`,
    });

    // Create a log group for the services
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/ecs/${props.appName}-${props.environment}`,
      retention: props.environment === 'prod' 
        ? logs.RetentionDays.TWO_WEEKS 
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // Task execution role
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: `${props.appName}-${props.environment}-execution-role`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Allow reading the database credentials secret
    props.dbCredentials.grantRead(executionRole);

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApiLoadBalancer', {
      loadBalancerName: `${props.appName}-${props.environment}-alb`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.apiSecurityGroup,
    });

    // Create ALB target groups
    const coreApiTargetGroup = new elbv2.ApplicationTargetGroup(this, 'CoreApiTargetGroup', {
      targetGroupName: `${props.appName}-${props.environment}-core-tg`,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: props.vpc,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: cdk.Duration.seconds(5),
      },
    });

    let integrationApiTargetGroup;
    if (props.deployIntegrationApi) {
      integrationApiTargetGroup = new elbv2.ApplicationTargetGroup(this, 'IntegrationApiTargetGroup', {
        targetGroupName: `${props.appName}-${props.environment}-integ-tg`,
        port: 4000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc: props.vpc,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          healthyHttpCodes: '200',
          timeout: cdk.Duration.seconds(5),
        },
      });
    }

    // Create ALB listeners
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true,
      }),
    });

    // In a real production scenario, you would add an HTTPS listener with a certificate
    // For development, we'll stick with HTTP
    const httpRoutingListener = alb.addListener('HttpRoutingListener', {
      port: 8080, // Development port for HTTP testing
      defaultAction: elbv2.ListenerAction.forward([coreApiTargetGroup]),
    });

    if (props.deployIntegrationApi && integrationApiTargetGroup) {
      // Add path-based routing rules
      httpRoutingListener.addAction('IntegrationApiRoute', {
        priority: 10,
        conditions: [
          elbv2.ListenerCondition.pathPatterns(['/integration/*']),
        ],
        action: elbv2.ListenerAction.forward([integrationApiTargetGroup]),
      });
    }

    // Define the Fargate task definitions
    const coreApiTaskDefinition = new ecs.FargateTaskDefinition(this, 'CoreApiTaskDefinition', {
      family: `${props.appName}-${props.environment}-core-api`,
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole,
    });

    let integrationApiTaskDefinition;
    if (props.deployIntegrationApi) {
      integrationApiTaskDefinition = new ecs.FargateTaskDefinition(this, 'IntegrationApiTaskDefinition', {
        family: `${props.appName}-${props.environment}-integration-api`,
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole,
      });
    }

    // Add container definitions
    const coreApiLogDriver = new ecs.AwsLogDriver({
      logGroup,
      streamPrefix: 'core-api',
    });

    let integrationApiLogDriver;
    if (props.deployIntegrationApi) {
      integrationApiLogDriver = new ecs.AwsLogDriver({
        logGroup,
        streamPrefix: 'integration-api',
      });
    }

    // Core API container
    const coreApiContainer = coreApiTaskDefinition.addContainer('CoreApiContainer', {
      image: ecs.ContainerImage.fromEcrRepository(this.coreApiRepository, 'latest'),
      logging: coreApiLogDriver,
      environment: {
        NODE_ENV: props.environment,
        PORT: '3000',
        DB_NAME: `${props.appName.replace(/[^a-zA-Z0-9]/g, '_')}_${props.environment}`,
        DB_HOST: props.dbEndpoint,
        DB_PORT: '5432',
      },
      secrets: {
        // Extract username and password from the secrets manager
        DB_USER: ecs.Secret.fromSecretsManager(props.dbCredentials, 'postgres_admin'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbCredentials, 'password'),
      },
      healthCheck: {
        command: [
          'CMD-SHELL', 
          'node -e "const http = require(\'http\'); const options = { hostname: \'localhost\', port: 3000, path: \'/health\', method: \'GET\', timeout: 5000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on(\'error\', () => { process.exit(1); }); req.setTimeout(5000, () => { process.exit(1); }); req.end();"'
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(120) // Longer startup period to allow database connection
      }
    });

    coreApiContainer.addPortMappings({
      containerPort: 3000,
      hostPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Integration API container
    let integrationApiContainer;
    if (props.deployIntegrationApi && integrationApiTaskDefinition) {
      integrationApiContainer = integrationApiTaskDefinition.addContainer('IntegrationApiContainer', {
        image: ecs.ContainerImage.fromEcrRepository(this.integrationApiRepository!, 'latest'),
        logging: integrationApiLogDriver,
        environment: {
          NODE_ENV: props.environment,
          PORT: '4000',
          CORE_API_URL: props.environment === 'prod' 
            ? 'https://api.prod-domain.com' 
            : `http://core-api.${namespace.namespaceName}:3000`,
          DB_NAME: `${props.appName.replace(/[^a-zA-Z0-9]/g, '_')}_${props.environment}`,
          DB_HOST: props.dbEndpoint,
          DB_PORT: '5432',
        },
        secrets: {
          DB_USER: ecs.Secret.fromSecretsManager(props.dbCredentials, 'postgres_admin'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbCredentials, 'password'),
        },
        healthCheck: {
          // Use Node.js to perform the health check instead of curl
          command: [
            'CMD-SHELL', 
            'node -e "const http = require(\'http\'); const options = { hostname: \'localhost\', port: 4000, path: \'/health\', method: \'GET\' }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on(\'error\', () => { process.exit(1); }); req.end();"'
          ],
          interval: cdk.Duration.seconds(30),  // Check every 30 seconds
          timeout: cdk.Duration.seconds(10),   // Allow 10 seconds for the check
          retries: 5,                         // Allow 5 failures before marking unhealthy
          startPeriod: cdk.Duration.seconds(60) // Give container 60s to start before health checks count
        },
      });

      integrationApiContainer.addPortMappings({
        containerPort: 4000,
        hostPort: 4000,
        protocol: ecs.Protocol.TCP,
      });
    }

    // Create the ECS services
    const coreApiService = new ecs.FargateService(this, 'CoreApiService', {
      serviceName: `${props.appName}-${props.environment}-core-api`,
      cluster,
      taskDefinition: coreApiTaskDefinition,
      desiredCount: props.environment === 'prod' ? 2 : 1,
      assignPublicIp: false,
      securityGroups: [props.apiSecurityGroup],
      cloudMapOptions: {
        name: 'core-api',
        cloudMapNamespace: namespace,
        dnsTtl: cdk.Duration.seconds(30),
      },
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      enableECSManagedTags: true,
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      minHealthyPercent: 100, // Ensures at least the desired count is running
      maxHealthyPercent: 200, // Allows scaling up to double during deployments
    });

    let integrationApiService;
    if (props.deployIntegrationApi && integrationApiTaskDefinition) {
      integrationApiService = new ecs.FargateService(this, 'IntegrationApiService', {
        serviceName: `${props.appName}-${props.environment}-integration-api`,
        cluster,
        taskDefinition: integrationApiTaskDefinition,
        desiredCount: props.environment === 'prod' ? 2 : 1,
        assignPublicIp: false,
        securityGroups: [props.apiSecurityGroup],
        cloudMapOptions: {
          name: 'integration-api',
          cloudMapNamespace: namespace,
          dnsTtl: cdk.Duration.seconds(30),
        },
        deploymentController: {
          type: ecs.DeploymentControllerType.ECS,
        },
        enableECSManagedTags: true,
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });
    }

    // Register targets with the target groups
    coreApiTargetGroup.addTarget(coreApiService);
    if (props.deployIntegrationApi && integrationApiTargetGroup && integrationApiService) {
      integrationApiTargetGroup.addTarget(integrationApiService);
    }

    // Save the API endpoint for use in other stacks
    this.apiEndpoint = `http://${alb.loadBalancerDnsName}:8080`;

    // Create CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      description: 'The endpoint URL for the API services',
      exportName: `${props.appName}-${props.environment}-api-endpoint`,
    });

    new cdk.CfnOutput(this, 'CoreApiRepositoryUri', {
      value: this.coreApiRepository.repositoryUri,
      description: 'The URI of the Core API ECR repository',
      exportName: `${props.appName}-${props.environment}-core-api-repo-uri`,
    });

    if (props.deployIntegrationApi && this.integrationApiRepository) {
      new cdk.CfnOutput(this, 'IntegrationApiRepositoryUri', {
        value: this.integrationApiRepository.repositoryUri,
        description: 'The URI of the Integration API ECR repository',
        exportName: `${props.appName}-${props.environment}-integration-api-repo-uri`,
      });
    }
  }
}