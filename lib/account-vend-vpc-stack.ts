import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

function getSubnetConfig(vpcName: string) {
  const data = JSON.parse(process.env.VENDING_SUBNETS ?? "[]");
  if (!data) {
    return [];
  }

  const results: any = [];
  data.forEach((item: {subnetName: string; subnetType: string; subnetsPerAZ: number}) => {
    for (let i=0; i < item["subnetsPerAZ"]; i++) {
      results.push({
        name: `${vpcName}-${item["subnetName"]}-${i+1}`,
        subnetType: item["subnetType"] === "public" ? ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE_WITH_EGRESS,
      })
    }
  });

  return results;
}

export class AccountVendVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  const subnetConfiguration = getSubnetConfig(process.env.VENDING_VPC_NAME ?? "");

  const vpc = new ec2.Vpc(this, 'Vpc', {
    vpcName: process.env.VENDING_VPC_NAME,
    ipAddresses: ec2.IpAddresses.cidr(process.env.VENDING_CIDR ?? ""),
    // enableDnsHostnames: true,
    // enableDnsSupport: true,
    // subnetConfiguration,
  });    
   
  }
}
