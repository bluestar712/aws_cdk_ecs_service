import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";

import { Construct } from "constructs";

interface EcsTaskDefinitionProps extends cdk.StackProps {
  ecrRepoUri: string;
}

export class EcsTaskDefinitionStack extends cdk.Stack {

  public readonly taskDefinition: cdk.aws_ecs.TaskDefinition;

  constructor(scope: Construct, id: string, props: EcsTaskDefinitionProps) {
    super(scope, id, props);

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
      image: ecs.ContainerImage.fromRegistry(`${props.ecrRepoUri}`), // Use the exported ECR output value
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    container.addPortMappings({
      containerPort: 6054,
    });

    this.taskDefinition = taskDefinition
  }
}
