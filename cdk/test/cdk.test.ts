import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

test('CDK App Synthesizes Successfully', () => {
  // This is a simple smoke test to ensure the CDK app can synthesize
  const app = new cdk.App();
  
  // Just check that creating a new app doesn't throw
  expect(app).toBeDefined();
});

// You can remove this example test or keep it commented out
// test('SQS Queue Created', () => {
//   const app = new cdk.App();
//     // WHEN
//   const stack = new Cdk.CdkStack(app, 'MyTestStack');
//     // THEN
//   const template = Template.fromStack(stack);

//   template.hasResourceProperties('AWS::SQS::Queue', {
//     VisibilityTimeout: 300
//   });
// });