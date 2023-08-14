import * as cdk from "aws-cdk-lib";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import { Construct } from "constructs";

interface AutoScalingProps extends cdk.StackProps {
  service: cdk.aws_ecs.FargateService;
  cloudWatchAlarm: cdk.aws_cloudwatch.Alarm;
}

export class AutoScalingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AutoScalingProps) {
    super(scope, id, props);

    const scalingTarget = props.service.autoScaleTaskCount({
      minCapacity: 2, // Minimum desired capacity
      maxCapacity: 10, // Maximum desired capacity
    });

    scalingTarget.scaleOnMetric("ScaleToMetric", {
      metric: props.cloudWatchAlarm.metric,
      scalingSteps: [
        { upper: 10, change: +1 },
        { lower: 50, change: -1 },
      ],
      cooldown: cdk.Duration.minutes(5),
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });
  }
}
