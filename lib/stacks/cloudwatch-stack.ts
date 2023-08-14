import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as sns from "aws-cdk-lib/aws-sns";

interface CloudWatchProps extends cdk.StackProps {
  cluster: cdk.aws_ecs.Cluster;
  service: cdk.aws_ecs.FargateService;
}

export class CloudWatchStack extends cdk.Stack {
  public readonly cloudWatchAlarm: cdk.aws_cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: CloudWatchProps) {
    super(scope, id, props);

    // Create a CloudWatch metric based on your ECS task definition metric
    const ecsTaskMetric = new cloudwatch.Metric({
      namespace: "AWS/ECS",
      metricName: "MemoryUtilization", // You can adjust the metric name as needed
      statistic: "Average",
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        cluster: props.cluster.clusterName,
        service: props.service.serviceName,
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
      "xxxxxx@xxx.com"
    ); // Replace with your email address
    snsTopic.addSubscription(subscription);

    // Add the SNS topic as an alarm action
    cloudWatchAlarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopic));

    this.cloudWatchAlarm = cloudWatchAlarm;
  }
}
