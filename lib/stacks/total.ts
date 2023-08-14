import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import path = require("path");
import * as ecrdeploy from "cdk-ecr-deployment";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

export class Total extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
        ======== CREATE ECR REPOSTIORY  ==============
    */

    const repo = new ecr.Repository(this, "TestRepoId", {
      repositoryName: "test-server",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const image = new DockerImageAsset(this, "CDKDockerImage", {
      directory: path.join(__dirname, "../../"),
    });

    new ecrdeploy.ECRDeployment(this, "DeployDockerImage", {
      src: new ecrdeploy.DockerImageName(image.imageUri),
      dest: new ecrdeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, "ECRRepositoryUri", {
      value: repo.repositoryUri,
    });

    /*
        ======== ECS TASK INITIFATION ==============
    */

    // Create an execution role for the Fargate task definition
    const executionRole = new iam.Role(this, "FargateExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    // Attach a policy that allows pulling images from ECR
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly"
      )
    );

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "MyTaskDefinition",
      {
        memoryLimitMiB: 3072,
        cpu: 1024,
        family: "test-task-definition",
        executionRole, // Set the execution role for the task definition
      }
    );

    const container = taskDefinition.addContainer("MyContainer", {
      image: ecs.ContainerImage.fromRegistry(`${repo.repositoryUri}`), // Use the exported ECR output value
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    container.addPortMappings({
      containerPort: 6054,
    });

    /*
        ======== CREATE VPC ==============
    */

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

    /*
        ======== CREATE SECURITY GROUP ==============
    */

    // Create a new security group for the load balancer
    const lbSecurityGroup = new ec2.SecurityGroup(
      this,
      "LoadBalancerSecurityGroup",
      {
        vpc,
        securityGroupName: "test-security-group",
        allowAllOutbound: true, // Allow outbound traffic
      }
    );

    // Add an inbound rule to the security group
    lbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcp(6054)
    ); // Replace 6054 with your app port

    /*
        ======== ECS CLUSTER AND SERVICE ==============
    */

    const cluster = new ecs.Cluster(this, "OverheadPoC", {
      vpc,
      clusterName: "test-cluster",
    });

    const service = new ecs.FargateService(this, "MyFargateService", {
      cluster,
      taskDefinition,
      serviceName: "test-service",
      desiredCount: 2, // Adjust as needed
      assignPublicIp: true, // Set to true if you want public IP addresses
      securityGroups: [lbSecurityGroup],
    });

    /*
        ======== CREATE TARGET GROUP ==============
    */

    // Create the Application Target Group
    const applicationTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "MyTargetGroup",
      {
        vpc: vpc, // Specify the VPC where your instances are located
        targetType: elbv2.TargetType.IP, // Use IP addresses as targets
        protocol: elbv2.ApplicationProtocol.HTTP,
        port: 6054,
        targets: [service],
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

    /*
        ======== LOAD BALENCER ==============
    */

    // Create the Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      "MyLoadBalancer",
      {
        vpc,
        loadBalancerName: "test-loadbalencer",
        internetFacing: true, // Create an internet-facing load balancer
        securityGroup: lbSecurityGroup, // Set the custom security group
      }
    );

    // Add the listener to the load balancer (you can add more listeners if needed)
    loadBalancer.addListener("Listener", {
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 6054, // The port on which the load balancer listens
      defaultTargetGroups: [applicationTargetGroup],
    });

    /*
        ======== CLOUD WATCH  ==============
    */

    // Create a CloudWatch metric based on your ECS task definition metric
    const ecsTaskMetric = new cloudwatch.Metric({
      namespace: "AWS/ECS",
      metricName: "MemoryUtilization", // You can adjust the metric name as needed
      statistic: "Average",
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        cluster: cluster.clusterName,
        service: service.serviceName,
      },
    });

    // Create a CloudWatch alarm for the ECS task metric
    const cloudWatchAlarm = new cloudwatch.Alarm(
      this,
      "ECSMemoryUtilizationAlarm",
      {
        metric: ecsTaskMetric,
        alarmName: "test-alarm",
        evaluationPeriods: 1, // Adjust as needed
        threshold: 80, // Adjust as needed
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: "ECS Memory Utilization Alarm",
      }
    );

    // Create an SNS topic to be used as the target for the CloudWatch alarm
    const snsTopic = new sns.Topic(this, "ECSMemoryUtilizationSnsTopic", {
      displayName: "ECS Memory Utilization Alarm SNS Topic",
    });

    // Subscribe an email address to the SNS topic
    const subscription = new subscriptions.EmailSubscription(
      "anatolii.blashkiv@outlook.com"
    ); // Replace with your email address
    snsTopic.addSubscription(subscription);

    // Add the SNS topic as an alarm action
    cloudWatchAlarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopic));

    /*
        ======== AUTO SCALING  ==============
    */

    const scalingTarget = service.autoScaleTaskCount({
      minCapacity: 2, // Minimum desired capacity
      maxCapacity: 10, // Maximum desired capacity
    });

    scalingTarget.scaleOnMetric("ScaleToMetric", {
      metric: cloudWatchAlarm.metric,
      scalingSteps: [
        { upper: 10, change: +1 },
        { lower: 50, change: -1 },
        { lower: 70, change: +3 },
      ],
      cooldown: cdk.Duration.minutes(5),
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });
    
  }
}
