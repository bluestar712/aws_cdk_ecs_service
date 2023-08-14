import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

interface TargetGroupProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.IVpc;
  service: cdk.aws_ecs.FargateService;
}

export class TargetGroupStack extends cdk.Stack {
  public readonly targetGroup: cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: TargetGroupProps) {
    super(scope, id, props);

    const applicationTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "MyTargetGroup",
      {
        vpc: props.vpc, // Specify the VPC where your instances are located
        targetType: elbv2.TargetType.IP, // Use IP addresses as targets
        protocol: elbv2.ApplicationProtocol.HTTP,
        port: 6054,
        targets: [props.service],
        targetGroupName: "test-target-group",
        healthCheck: {
          path: "/", // Specify the health check path
          port: "6054", // Port where your app is listening
          protocol: elbv2.Protocol.HTTP, // Use HTTP for health checks
          interval: cdk.Duration.seconds(30), // Health check interval
          timeout: cdk.Duration.seconds(5), // Health check timeout
          healthyThresholdCount: 5, // Number of consecutive successes required to be considered healthy
          unhealthyThresholdCount: 2, // Number of consecutive failures required to be considered unhealthy
          healthyHttpCodes: "200", // Specify individual status code for success
        },
      }
    );

    this.targetGroup = applicationTargetGroup;
  }
}
