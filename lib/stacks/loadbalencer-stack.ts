import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

interface LoadBalancerProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.IVpc;
  securityGroup: cdk.aws_ec2.ISecurityGroup;
  targetGroup: cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup;
}

export class LoadBalencerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LoadBalancerProps) {
    super(scope, id, props);

    // Create the Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      "MyLoadBalancer",
      {
        vpc: props.vpc,
        loadBalancerName: "test-loadbalencer",
        internetFacing: true, // Create an internet-facing load balancer
        securityGroup: props.securityGroup, // Set the custom security group
      }
    );

    // Add the listener to the load balancer (you can add more listeners if needed)
    loadBalancer.addListener("Listener", {
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 6054, // The port on which the load balancer listens
      defaultTargetGroups: [props.targetGroup],
    });
  }
}
