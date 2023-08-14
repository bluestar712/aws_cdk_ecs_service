# AWS CDK ECS 

This project involves constructing ECS infrastructure using AWS CDK in TypeScript.

The `total.ts` file encompasses the entire process within a single file. However, the current project has deviated from using the `total.ts` file, opting instead to divide the functionality into separate stacks.

## Useful commands

* `cdk bootstrap`   build cdk running environment stack on aws cloudformation
* `cdk deploy --all` deploy all stacks to aws cloudformation
* `cdk deploy stack` deploy specific stack to aws cloudformation

## stack features and stack deployment order

### `ecr-stack`  

The purpose of this stack is to create a repository where Docker container images can be stored and managed.

To begin, the stack instantiates an ECR repository named "test-server". This repository holds Docker images and supports the removal policy of "DESTROY," ensuring that resources can be effectively managed.

The stack also leverages the CDK to build a Docker image asset. This asset is generated from the contents located within a specific directory, facilitated by the DockerImageAsset function. This directory path is established by combining the __dirname variable with additional path segments, ultimately guiding the asset creation process.

As part of the deployment workflow, the cdk-ecr-deployment package is employed. This package streamlines the process of deploying Docker images to the ECR repository. The ECRDeployment construct manages the transfer of Docker images from a source (src) to a destination (dest), effectively updating the repository with the latest version of the image.

To provide visibility into the repository's location, an output is generated using the CfnOutput construct. This output exposes the URI of the ECR repository through the "ECRRepositoryUri" key, allowing other components of the infrastructure to access the repository as needed.


### `ecs-task-definition-stack`  

The ECS Task Definition Stack focuses on defining how your applications should run inside containers. It creates an execution role that grants necessary permissions, like pulling images from the ECR repository. Using this role, the stack sets up a Fargate Task Definition, acting as a blueprint for your application's environment.

Within this task definition, a container named "MyContainer" is established. It utilizes a Docker image from the ECR repository provided through the stack's input. The container's resource requirements are specified, with a memory limit of 1024 MiB and a CPU allocation of 512 units. Importantly, the container is configured to communicate through port 6054.

Upon completion, the stack outputs the finalized task definition, ensuring that your applications can be consistently deployed and executed within containers, with all necessary configurations in place. This streamlines the process of launching your applications and ensures they run smoothly and efficiently within their designated containers.

### `vpc stack`   

The VPC stack creates and configures a Virtual Private Cloud (VPC) environment within the AWS infrastructure. The stack defines a VPC with the specified CIDR range "10.0.0.0/16", which determines the range of private IP addresses available for resources within the VPC.

This VPC is designed to support high availability with a maximum of three Availability Zones (AZs). The stack establishes a public subnet named "PublicSubnet" within the VPC, configured to be a public subnet. This means resources deployed in this subnet can have public IP addresses and can be accessed from the internet. The subnet is defined with a subnet mask of 24 bits, represented as "10.0.1.0/24".

Upon successful deployment of this stack, it exports the VPC's unique identifier (vpcId) as an output. This identifier can be utilized by other components of the infrastructure to interact with resources within the VPC. The VpcStack class also exposes the VPC instance (vpc) as a public property, allowing other stacks to reference and utilize the VPC configuration.

### `security-group-stack`   

The Security Group stack is responsible for defining and configuring a security group within the specified Virtual Private Cloud (VPC). This security group is designed to manage inbound and outbound traffic for resources within the VPC.

The stack utilizes the provided vpc as a prop to ensure that the security group is associated with the correct VPC. The security group is created with the name "LoadBalancerSecurityGroup" and is configured to allow all outbound traffic, facilitating communication from resources within the VPC to external destinations.

In addition, an inbound rule is added to the security group. This rule allows incoming traffic from any IPv4 address (specified as "0.0.0.0/0") on the TCP port 6054. You can replace the port number (6054) with the appropriate port number required for your application.

Upon successful deployment of this stack, the stack instance retains a reference to the created security group (securityGroup). This allows other components of the infrastructure to reference and utilize this security group for managing network traffic and access controls within the specified VPC.

### `ecs-cluster-stack`   

The ECS Cluster stack is dedicated to establishing and configuring an Amazon Elastic Container Service (ECS) cluster within the provided Virtual Private Cloud (VPC). This cluster serves as a platform for managing and deploying containerized applications.

The stack leverages the vpc, taskDefinition, and securityGroup props to ensure integration with the specified VPC, task definition, and security group, respectively.

Within this ECS cluster, a Fargate service named "MyFargateService" is created. This service is associated with the defined cluster and utilizes the provided task definition. The service configuration includes a desired count of 2 instances, which can be adjusted based on requirements. Additionally, the service is set to assign public IP addresses (assignPublicIp: true), allowing instances within the service to have public IP addresses for internet communication.

The associated security group (securityGroup) helps control network access to instances within the Fargate service.

Upon successful deployment of this stack, the created ECS cluster instance (cluster) and Fargate service instance (service) are retained. These instances can be accessed and utilized by other components of the infrastructure for deploying and managing containerized applications in an orchestrated manner within the specified VPC.

### `target-group-stack`   

The Target Group stack plays a crucial role in configuring an Application Load Balancer's target group within the specified Virtual Private Cloud (VPC). This target group directs incoming traffic to specific resources registered as targets, facilitating load balancing and routing of requests.

The stack relies on the vpc and service props to ensure seamless integration with the designated VPC and the Fargate service.

Within this configuration, an Application Load Balancer's Application Target Group is established. The target group utilizes IP addresses as targets (TargetType.IP) and communicates over the HTTP protocol. Incoming requests are directed to the resources registered under the service. These resources are part of the ECS Fargate service previously defined.

The target group's health check settings ensure continuous monitoring of the registered resources. Health checks are performed by sending HTTP requests to the specified path and port ("6054"), adhering to the defined protocol. The interval between health checks, timeout, and threshold counts for determining health or unhealthiness are carefully tuned.

Upon successful deployment of this stack, the created Application Target Group instance (targetGroup) is retained. This instance can be employed by other components of the infrastructure, allowing the Application Load Balancer to effectively distribute incoming traffic among the registered resources within the specified VPC.

### `loadbalancer-stack`   

The Load Balancer stack plays a pivotal role in orchestrating the creation and configuration of an Amazon Elastic Load Balancer (ELB) within the designated Virtual Private Cloud (VPC). The ELB efficiently distributes incoming traffic across registered resources, enhancing the availability and scalability of applications.

This stack leverages the vpc, securityGroup, and targetGroup props to ensure seamless integration with the specified VPC, a custom security group, and an Application Target Group, respectively.

Within this stack, an Application Load Balancer (ALB) is meticulously crafted. The ALB is architected to operate as an internet-facing load balancer, serving as the entry point for external traffic. The custom security group, designated as securityGroup, enforces network access controls for the ALB.

The ALB's listener configuration is established, allowing it to communicate over the HTTP protocol on port 6054. This listener is associated with the provided targetGroup, ensuring that incoming requests are intelligently distributed among the registered resources within the associated Application Target Group.

Upon successful deployment of this stack, the Amazon Elastic Load Balancer instance is instantiated with the defined properties, seamlessly routing incoming traffic to the appropriate resources based on the configured load balancing rules.

### `cloudwatch-stack`   

The CloudWatch stack plays a critical role in setting up monitoring and alerting for Amazon Web Services (AWS) resources, ensuring proactive management and swift response to potential issues within the infrastructure.

This stack is designed to work seamlessly with Amazon Elastic Container Service (ECS) clusters and Fargate services, as indicated by the cluster and service props.

The stack commences by crafting a CloudWatch metric that specifically tracks the "MemoryUtilization" metric within the "AWS/ECS" namespace. This metric records the average memory utilization of the ECS resources over a defined period, which is set to every 5 minutes. The dimensions of the metric are dynamically derived from the cluster and service names, ensuring accurate context for monitoring.

A CloudWatch alarm, named "ECSMemoryUtilizationAlarm," is created based on the previously defined metric. This alarm is configured to trigger when the metric's value surpasses a specified threshold of 80%. The comparison operator "GREATER_THAN_OR_EQUAL_TO_THRESHOLD" drives the alarm logic.

In the event of a breach, the alarm is poised to take action. An Amazon Simple Notification Service (SNS) topic is established as the target for this alarm. This topic serves as a communication channel for notifications. In this instance, an email subscription (xxxxxx@xxx.com) is associated with the SNS topic, enabling email notifications to be sent when the alarm is triggered.

The CloudWatch alarm action is configured to notify the SNS topic upon activation, thus initiating the dispatch of email notifications.

Upon successful deployment of this stack, the CloudWatch alarm (cloudWatchAlarm) is fully functional, proactively monitoring ECS resources' memory utilization and initiating notifications through the SNS topic in case of breaches. This setup empowers AWS users to promptly address potential issues and maintain the health and stability of their infrastructure.

### `autoscaling-stack`   

The Auto Scaling stack plays a pivotal role in dynamically adjusting the capacity of an Amazon ECS Fargate service based on predefined metrics and thresholds. This capability ensures that the infrastructure scales appropriately in response to changing workload demands.

Aligned with the ECS Fargate service (service) and a CloudWatch alarm (cloudWatchAlarm), this stack operates seamlessly to facilitate automatic scaling of the service.

At its core, the stack establishes a scaling target using the ECS Fargate service's autoScaleTaskCount method. This target is configured with a minimum desired capacity of 2 instances and a maximum desired capacity of 10 instances, thus defining the scaling range.

To control the scaling behavior, a scaling policy is defined with the name "ScaleToMetric." This policy is triggered by the CloudWatch alarm's metric (props.cloudWatchAlarm.metric), which monitors the memory utilization of the ECS service. Based on the metric's behavior, scaling steps are configured to dynamically adjust capacity:

If the metric exceeds the upper threshold of 10, the scaling policy increases capacity by one instance.
If the metric drops below the lower threshold of 50, the scaling policy reduces capacity by one instance.
A cooldown period of 5 minutes is applied to prevent rapid and unnecessary scaling actions. The CHANGE_IN_CAPACITY adjustment type ensures that the scaling actions are relative to the current capacity.

With successful deployment of this stack, the ECS Fargate service (service) is endowed with an auto-scaling mechanism that adapts the capacity of the service according to the configured scaling policy. This proactive approach ensures that the infrastructure efficiently manages varying workloads, optimizes resource utilization, and maintains application performance within the specified thresholds.


