#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AccountVendVpcStack } from '../lib/account-vend-vpc-stack';
import { AccountVendVpcPipelineStack } from '../lib/pipeline';

const app = new cdk.App();
new AccountVendVpcStack(app, 'AccountVendVpcStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
//new AccountVendVpcPipelineStack(app, 'AccountVendVpcPipelineStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  //env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
//});