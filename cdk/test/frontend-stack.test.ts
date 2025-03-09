import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

describe('FrontendStack', () => {
  let app: cdk.App;
  let stack: FrontendStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'ad-cm',
      environment: 'dev',
      apiEndpoint: 'https://api-test.example.com',
      env: { account: '123456789012', region: 'eu-central-1' },
    });
    template = Template.fromStack(stack);
  });

  test('S3 Bucket Created with Correct Configuration', () => {
    // Verify S3 bucket exists
    template.resourceCountIs('AWS::S3::Bucket', 1);
    
    // Check bucket properties
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html'
      }
    });
  });

  test('CloudFront Distribution Created Correctly', () => {
    // Verify CloudFront distribution exists
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    
    // Check distribution properties without the ViewerCertificate
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2',
        PriceClass: 'PriceClass_100'
      }
    });
  });

  test('CloudFront Origin Access Identity Created', () => {
    // Verify CloudFront OAI exists
    template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
  });

  test('Output Exports Created', () => {
    // Verify expected outputs exist with descriptions
    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
    
    // Check for distribution id export
    const distributionId = Object.values(outputs).find(
      (output) => output.Description && output.Description.includes('distribution')
    );
    expect(distributionId).toBeDefined();
    expect(distributionId?.Export).toBeDefined();
    
    // Check for bucket name export
    const bucketName = Object.values(outputs).find(
      (output) => output.Value && 
                  output.Value['Ref'] && 
                  output.Export
    );
    expect(bucketName).toBeDefined();
  });
});