import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";

interface EcsClusterStackProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.IVpc;
  taskDefinition: cdk.aws_ecs.TaskDefinition;
  securityGroup: cdk.aws_ec2.ISecurityGroup;
}

export class EcsClusterStack extends cdk.Stack {
  public readonly service: cdk.aws_ecs.FargateService;
  public readonly cluster: cdk.aws_ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, "OverheadPoC", {
      vpc: props.vpc,
      clusterName: "test-cluster",
    });

    const service = new ecs.FargateService(this, "MyFargateService", {
      cluster,
      taskDefinition: props.taskDefinition,
      serviceName: "test-service",
      desiredCount: 2, // Adjust as needed
      assignPublicIp: true, // Set to true if you want public IP addresses
      securityGroups: [props.securityGroup],
    });

    this.cluster = cluster;
    this.service = service;
  }
}
