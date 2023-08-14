import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcStack extends cdk.Stack {
  public readonly vpc: cdk.aws_ec2.IVpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new VPC
    const vpc = new ec2.Vpc(this, "test-vpc", {
      cidr: "10.0.0.0/16", // Specify the CIDR range for the VPC
      maxAzs: 3, // Specify the maximum number of Availability Zones
      subnetConfiguration: [
        {
          name: "PublicSubnet", // Name of the subnet
          subnetType: ec2.SubnetType.PUBLIC, // Public subnet
          cidrMask: 24, // Subnet mask (e.g., 10.0.1.0/24)
        },
      ],
    });

    new cdk.CfnOutput(this, "VpcId", {
      value: vpc.vpcId,
    });

    this.vpc = vpc
  }
}
