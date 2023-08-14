import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface SecurityGroupProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.IVpc;
}

export class SecurityGroupStack extends cdk.Stack {
  public readonly securityGroup: cdk.aws_ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupProps) {
    super(scope, id, props);

    // Create a new security group for the load balancer
    const lbSecurityGroup = new ec2.SecurityGroup(
      this,
      "LoadBalancerSecurityGroup",
      {
        vpc: props.vpc,
        securityGroupName: "test-security-group",
        allowAllOutbound: true, // Allow outbound traffic
      }
    );

    // Add an inbound rule to the security group
    lbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcp(6054)
    ); // Replace 6054 with your app port

    this.securityGroup = lbSecurityGroup;
  }
}
