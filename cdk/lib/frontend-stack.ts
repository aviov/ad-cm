import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  apiEndpoint: string;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    // Create an S3 bucket to host the static website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${props.appName}-${props.environment}-frontend`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing support
      publicReadAccess: false, // We'll use CloudFront OAI for access control
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'prod',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create an Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${props.appName} ${props.environment} frontend`,
    });

    // Grant read permissions to CloudFront
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // CloudFront cache policy
    const cachePolicy = new cloudfront.CachePolicy(this, 'CachePolicy', {
      cachePolicyName: `${props.appName}-${props.environment}-cache-policy`,
      comment: `Cache policy for ${props.appName} ${props.environment} frontend`,
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.minutes(1),
      maxTtl: cdk.Duration.days(365),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.HttpOrigin(websiteBucket.bucketWebsiteUrl),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy,
      },
      additionalBehaviors: {
        '/assets/*': {
          origin: new origins.HttpOrigin(websiteBucket.bucketWebsiteUrl),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy,
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // Handle client-side routing
          ttl: cdk.Duration.minutes(30),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe edge locations
      enabled: true,
      comment: `${props.appName} ${props.environment} frontend distribution`,
    });

    // Create a runtime config file in S3
    // Instead of using a custom resource with a provider, we'll create a simple config file directly
    const configContent = JSON.stringify({
      apiEndpoint: props.apiEndpoint,
      environment: props.environment,
      timestamp: Date.now().toString()
    });
    
    // Deploy the runtime config to S3
    new s3deploy.BucketDeployment(this, 'DeployRuntimeConfig', {
      sources: [
        s3deploy.Source.data('config.json', configContent)
      ],
      destinationBucket: websiteBucket,
      destinationKeyPrefix: 'config',
      distribution, // Invalidate cache on deploy
      distributionPaths: ['/config/config.json'],
    });

    // Deploy frontend assets to S3
    // Note: In a real setup, this would be done through CI/CD
    // This is just a placeholder to show how it would be done through CDK
    /*
    const frontendDeployment = new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../client/build')], // Adjust path as necessary
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
    */

    // Deploy basic index.html file to get started
    const basicIndexHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${props.appName} - ${props.environment}</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
        </style>
        </head>
        <body>
        <div class="container">
            <h1>${props.appName} - ${props.environment}</h1>
            <p>Infrastructure has been successfully deployed!</p>
            <p>Replace this placeholder with real frontend application.</p>
        </div>
        <script>
            // Will try to load the config
            fetch('/config/config.json')
            .then(response => response.json())
            .then(config => {
                console.log('Configuration loaded:', config);
                const configInfo = document.createElement('div');
                configInfo.innerHTML = '<h2>Runtime Configuration</h2>' +
                '<pre>' + JSON.stringify(config, null, 2) + '</pre>';
                document.querySelector('.container').appendChild(configInfo);
            })
            .catch(error => console.error('Error loading config:', error));
        </script>
        </body>
        </html>
    `;

    new s3deploy.BucketDeployment(this, 'DeployPlaceholderIndex', {
    sources: [
        s3deploy.Source.data('index.html', basicIndexHtml)
    ],
    destinationBucket: websiteBucket,
    distribution,
    distributionPaths: ['/index.html'],
    });

    // Create CloudFormation outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'The domain name of the CloudFront distribution',
      exportName: `${props.appName}-${props.environment}-distribution-domain`,
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'The name of the S3 bucket hosting the website',
      exportName: `${props.appName}-${props.environment}-website-bucket`,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'The URL of the frontend application',
      exportName: `${props.appName}-${props.environment}-frontend-url`,
    });
    
    new cdk.CfnOutput(this, 'ConfigUrl', {
      value: `https://${distribution.distributionDomainName}/config/config.json`,
      description: 'The URL of the runtime configuration file',
      exportName: `${props.appName}-${props.environment}-config-url`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'The ID of the CloudFront distribution',
      exportName: `${props.appName}-${props.environment}-distribution-id`,
    });
  }
}