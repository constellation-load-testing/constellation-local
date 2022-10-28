import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { FargateService } from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';

export class ConstellationRemoteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ROLES
    const testerRemoteRole = new iam.Role(this, "constellation-remote-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "tester-remote-role"
    })

    const timestreamDBRole = new iam.Role(this, 'ecsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: "timestream-db-role"
    })

    timestreamDBRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTimestreamFullAccess')
    )

    // CONSTRUCTS
    // VPC
    const vpc = new ec2.Vpc(this, "vpc-remote-constellation")

    // ECS CLUSTERS
    const cluster = new ecs.Cluster(this, "cluster-constellation", {
      vpc: vpc
    })

    // TASK DEFINITIONS & SERVICES
    // - Data aggregator
    // L3 construct for aggregator due to DNS exposure
    const telegrafALBService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'constellation-telegraf', {
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,   
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("athresher/teleproto"),
        containerPort: 8186,
        containerName: 'telegraf-container',
        taskRole: timestreamDBRole,
      },
      memoryLimitMiB: 1024,
      publicLoadBalancer: true      
    })

    // - Tester
    const testerTaskDef = new ecs.FargateTaskDefinition(this, 'constellation-task-def', 
      {
        memoryLimitMiB: 1024,
        cpu: 512,
        taskRole: testerRemoteRole,
      }
    )

    // this.account

    testerTaskDef.addContainer('constellation-tester-container', {
      image: ecs.ContainerImage.fromRegistry("athresher/loader_prototype"),
      memoryLimitMiB: 1024,
      containerName: 'constellation-tester-container',
      essential: true, // default for single container taskdefs
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'constellation-tester',
        logRetention: 7 // logs expire after 7 days
      }),
      environment: {
        URL: "https://loader-prototype.s3.us-west-1.amazonaws.com/test_script.js?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDMaCXVzLXdlc3QtMiJIMEYCIQCFhDSflEb2MKYbhj4Z4QnfZAuEx4E8P4DcmRKvFpbRXQIhAJ15C1GTsOWXZNcwyKWIJl%2FrFptkqg1yv0E4Bx9C4RmJKvsCCBwQABoMNTc4NzkwNDg1Nzg0IgyMMN87G4JZHfzHGc8q2ALogBRW6%2FbhqhxEMkrRh78127j2KQXH6K97s2pya5e2Np0UyVBNpIGVUdSetKn7I3a1RwBwC%2BAiMb5YXsGTQBC8%2B5nUJC9VVL3FF5m1Kj2Ox9Us2Rq23ZHI8UyAr1x6VqhI9i9Vgw%2FahPbV%2BKDExwcsq5%2FXrbKk2nH6aNXC8oZUq%2BEMsBMqV%2BTqVDUnv6%2F4%2FKoqSiChk%2FWLezUnt80ZuVPu3V4VCuHfpnDg5jOVxYCkmDkGyq1MoU0rbcb9yMvF2kMmwbIQ0EJh5DLhz7gGMTiVEyv4JN%2Bqm7YFBIKLsXttP7z30MdS0Ir0V1bwF7nXKvWVWTNu%2B5QAFkJTBRp7XuSWIQ3catYVrMnwGU7wbEQ3NJNx2%2FUcu6MIq3KOalMRRZgyrZiolq6Hfb0L1yRmS1v21xVV%2BqR6jYQBIDu3GRhHCBKVTNEV07Kn8WtFvdHDF9vphY33%2Bgit9jC69eqaBjqyAodZDLQq1DiJh%2FNUaYNQGTEqzrb0jjtImdJewdAY9Oz2acxgo%2FlMeadnr7hyZKdWH3SUBFBvyZ290C19tT2bMBYwNXladYIzMIdc%2BMDck84%2B5S%2BhS8J%2FgHvpwIQJFNGjlv89RPDyR3nFl50gmEOnmP6w9I45eThRjeUWE2BoyFLA7RNmZ%2FhHXR0XY4lOhZF4%2FtiUDksgB9XGi%2FWi9mFlnqKzV41kPKlT6Dqm%2FH8DJvH2mNOZCJChIbDUstMr%2BvHSLkgLaveulbmPzJtOe5nbq07jeQyWWflZnxb1e6UfqIl58o%2BDISrKGqyF01c%2BlIrajHphu3VVRboEN%2BcO9%2BG2RLuDkUWhKlkmsy%2FOKOXlZ4jGyE69KkyMQV8OGvBhXxhKxVPuUq51aRqAx%2F5%2B%2B71st0nOLg%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20221027T190910Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAYNQUZ54MF7HNR5TU%2F20221027%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Signature=b456640f36c79f5d7c0c9a9983e755dc1fcf587abed6bf1968947f682e7c3db3",
        DNS: telegrafALBService.loadBalancer.loadBalancerDnsName,
      }
    })

    const testerService = new ecs.FargateService(this, 'constellation-tester-service', {
      cluster: cluster,
      taskDefinition: testerTaskDef,
      desiredCount: 1, // change to non-1 after pause mode implemented
    })
  }
}
