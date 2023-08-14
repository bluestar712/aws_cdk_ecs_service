#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EcrStack } from "../lib/stacks/ecr-stack";
import { EcsTaskDefinitionStack } from "../lib/stacks/ecs-task-definition-stack";
import { VpcStack } from "../lib/stacks/vpc-stack";
import { SecurityGroupStack } from "../lib/stacks/security-group-stack";
import { EcsClusterStack } from "../lib/stacks/ecs-cluster-stack";
import { TargetGroupStack } from "../lib/stacks/target-group-stack";
import { LoadBalencerStack } from "../lib/stacks/loadbalencer-stack";
import { CloudWatchStack } from "../lib/stacks/cloudwatch-stack";
import { AutoScalingStack } from "../lib/stacks/autoscaling-stack";

const app = new cdk.App();

const ecrStack = new EcrStack(app, "ECrStack");

const ecsTaskDefinitionStack = new EcsTaskDefinitionStack(
  app,
  "EcsTaskDefinitionStack",
  { ecrRepoUri: ecrStack.ecrRepositoryUri }
);

const vpcStack = new VpcStack(app, "VpcStack");

const securityGroupStack = new SecurityGroupStack(app, "SecurityGroupStack", {
    vpc: vpcStack.vpc
});

const ecsClusterStack = new EcsClusterStack(app, "EcsClusterStack", {
    vpc: vpcStack.vpc,
    taskDefinition: ecsTaskDefinitionStack.taskDefinition,
    securityGroup: securityGroupStack.securityGroup
});

const targetGroupStack = new TargetGroupStack(app, "TargetGroupStack", {
    vpc: vpcStack.vpc,
    service: ecsClusterStack.service
});

const loadBalancerStack = new LoadBalencerStack(app, "LoadBalencerStack", {
    vpc: vpcStack.vpc,
    securityGroup: securityGroupStack.securityGroup,
    targetGroup: targetGroupStack.targetGroup
})

const cloudWatchStack = new CloudWatchStack(app, "CloudWatchStack", {
    cluster: ecsClusterStack.cluster,
    service: ecsClusterStack.service
})

const autoScalingStack = new AutoScalingStack(app, "AutoScalingStack", {
    service: ecsClusterStack.service,
    cloudWatchAlarm: cloudWatchStack.cloudWatchAlarm
})

app.synth();

